#!/usr/bin/env node

/**
 * PPT2Code 批量处理脚本
 * 用于批量处理服务器上已有的PPT文件
 */

const fs = require('fs-extra');
const path = require('path');
const pptConverter = require('./utils/pptConverter');
const qrGenerator = require('./utils/qrGenerator');
const fileHandler = require('./utils/fileHandler');

class BatchProcessor {
    constructor(options = {}) {
        this.sourceDir = options.sourceDir || './source-ppts';
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.maxConcurrent = options.maxConcurrent || 3;
        this.results = [];
    }

    /**
     * 开始批量处理
     */
    async start() {
        console.log('🚀 开始批量处理PPT文件...');
        console.log(`📁 源目录: ${this.sourceDir}`);
        console.log(`🌐 基础URL: ${this.baseUrl}`);
        console.log(`⚡ 并发数: ${this.maxConcurrent}`);
        console.log('─'.repeat(50));

        try {
            // 检查源目录
            if (!await fs.pathExists(this.sourceDir)) {
                throw new Error(`源目录不存在: ${this.sourceDir}`);
            }

            // 获取所有PPT文件
            const pptFiles = await this.getPPTFiles();
            
            if (pptFiles.length === 0) {
                console.log('❌ 未找到PPT文件');
                return;
            }

            console.log(`📄 找到 ${pptFiles.length} 个PPT文件`);
            
            // 批量处理
            await this.processBatch(pptFiles);
            
            // 显示结果
            this.showResults();
            
        } catch (error) {
            console.error('❌ 批量处理失败:', error.message);
            process.exit(1);
        }
    }

    /**
     * 获取所有PPT文件
     */
    async getPPTFiles() {
        const files = await fs.readdir(this.sourceDir);
        return files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.ppt' || ext === '.pptx';
        });
    }

    /**
     * 批量处理文件
     */
    async processBatch(files) {
        const chunks = this.chunkArray(files, this.maxConcurrent);
        let processedCount = 0;

        for (const chunk of chunks) {
            const promises = chunk.map(file => this.processFile(file));
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                const fileName = chunk[index];
                processedCount++;
                
                if (result.status === 'fulfilled') {
                    this.results.push({
                        success: true,
                        fileName: fileName,
                        ...result.value
                    });
                    console.log(`✅ [${processedCount}/${files.length}] ${fileName} 处理成功`);
                } else {
                    this.results.push({
                        success: false,
                        fileName: fileName,
                        error: result.reason.message
                    });
                    console.log(`❌ [${processedCount}/${files.length}] ${fileName} 处理失败: ${result.reason.message}`);
                }
            });
        }
    }

    /**
     * 处理单个文件
     */
    async processFile(fileName) {
        const sourceFilePath = path.join(this.sourceDir, fileName);
        const fileId = this.generateFileId(fileName);
        
        // 复制文件到uploads目录
        const uploadsDir = path.join(__dirname, 'uploads');
        await fs.ensureDir(uploadsDir);
        const targetFilePath = path.join(uploadsDir, `${fileId}${path.extname(fileName)}`);
        await fs.copy(sourceFilePath, targetFilePath);

        try {
            // 转换PPT
            const convertedPath = await pptConverter.convertPPT(targetFilePath, fileId);
            
            // 生成预览链接
            const previewUrl = `${this.baseUrl}/preview/${fileId}`;
            
            // 生成二维码
            const qrCodePath = await qrGenerator.generateQRCode(previewUrl, fileName, fileId);
            
            return {
                fileId: fileId,
                originalName: fileName,
                previewUrl: previewUrl,
                qrCodePath: qrCodePath,
                convertedPath: convertedPath
            };
        } catch (error) {
            // 清理失败的文件
            await fs.remove(targetFilePath).catch(() => {});
            throw error;
        }
    }

    /**
     * 生成文件ID
     */
    generateFileId(fileName) {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const baseName = path.parse(fileName).name.replace(/[^a-zA-Z0-9]/g, '_');
        return `${baseName}-${timestamp}-${random}`;
    }

    /**
     * 将数组分块
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * 显示处理结果
     */
    showResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 批量处理结果统计');
        console.log('='.repeat(50));

        const successCount = this.results.filter(r => r.success).length;
        const failureCount = this.results.filter(r => !r.success).length;

        console.log(`✅ 成功: ${successCount} 个文件`);
        console.log(`❌ 失败: ${failureCount} 个文件`);
        console.log(`📈 成功率: ${((successCount / this.results.length) * 100).toFixed(1)}%`);

        // 显示成功的文件
        if (successCount > 0) {
            console.log('\n📄 成功处理的文件:');
            this.results
                .filter(r => r.success)
                .forEach(result => {
                    console.log(`  • ${result.fileName}`);
                    console.log(`    预览: ${result.previewUrl}`);
                    console.log(`    二维码: /qrcodes/${result.fileId}.png`);
                });
        }

        // 显示失败的文件
        if (failureCount > 0) {
            console.log('\n❌ 处理失败的文件:');
            this.results
                .filter(r => !r.success)
                .forEach(result => {
                    console.log(`  • ${result.fileName}: ${result.error}`);
                });
        }

        // 生成报告文件
        this.generateReport();
    }

    /**
     * 生成处理报告
     */
    async generateReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            sourceDir: this.sourceDir,
            baseUrl: this.baseUrl,
            totalFiles: this.results.length,
            successCount: this.results.filter(r => r.success).length,
            failureCount: this.results.filter(r => !r.success).length,
            results: this.results
        };

        const reportPath = path.join(__dirname, `batch-report-${Date.now()}.json`);
        await fs.writeJson(reportPath, reportData, { spaces: 2 });
        
        console.log(`\n📋 详细报告已保存到: ${reportPath}`);
    }
}

// 命令行参数处理
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i];
        const value = args[i + 1];

        switch (key) {
            case '--source':
            case '-s':
                options.sourceDir = value;
                break;
            case '--url':
            case '-u':
                options.baseUrl = value;
                break;
            case '--concurrent':
            case '-c':
                options.maxConcurrent = parseInt(value) || 3;
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
        }
    }

    return options;
}

function showHelp() {
    console.log(`
PPT2Code 批量处理工具

用法:
  node batch-process.js [选项]

选项:
  -s, --source <目录>      PPT文件源目录 (默认: ./source-ppts)
  -u, --url <URL>          服务器基础URL (默认: http://localhost:3000)
  -c, --concurrent <数量>   并发处理数量 (默认: 3)
  -h, --help              显示帮助信息

示例:
  node batch-process.js --source ./my-ppts --url https://my-server.com
  node batch-process.js -s /path/to/ppts -c 5
`);
}

// 主程序
async function main() {
    const options = parseArgs();
    const processor = new BatchProcessor(options);
    await processor.start();
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
});

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = BatchProcessor;
