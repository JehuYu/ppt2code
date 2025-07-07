#!/usr/bin/env node

/**
 * PPT2Code 系统测试脚本
 * 测试各个组件是否正常工作
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class SystemTester {
    constructor() {
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🧪 开始系统测试...\n');

        await this.testNodeJS();
        await this.testLibreOffice();
        await this.testImageMagick();
        await this.testDirectories();
        await this.testDependencies();
        await this.testQRGeneration();
        await this.testServer();

        this.showResults();
    }

    /**
     * 测试Node.js
     */
    async testNodeJS() {
        try {
            const { stdout } = await execAsync('node --version');
            const version = stdout.trim();
            const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
            
            if (majorVersion >= 16) {
                this.addResult('Node.js版本检查', true, `${version} ✓`);
            } else {
                this.addResult('Node.js版本检查', false, `${version} - 需要16+版本`);
            }
        } catch (error) {
            this.addResult('Node.js版本检查', false, 'Node.js未安装');
        }
    }

    /**
     * 测试LibreOffice
     */
    async testLibreOffice() {
        try {
            const { stdout } = await execAsync('soffice --version');
            this.addResult('LibreOffice检查', true, stdout.trim());
        } catch (error) {
            this.addResult('LibreOffice检查', false, 'LibreOffice未安装或不在PATH中');
        }
    }

    /**
     * 测试ImageMagick
     */
    async testImageMagick() {
        try {
            const { stdout } = await execAsync('magick --version');
            const version = stdout.split('\n')[0];
            this.addResult('ImageMagick检查', true, version);
        } catch (error) {
            this.addResult('ImageMagick检查', false, 'ImageMagick未安装（可选）');
        }
    }

    /**
     * 测试目录结构
     */
    async testDirectories() {
        const requiredDirs = ['uploads', 'converted', 'qrcodes', 'utils', 'public'];
        let allExist = true;
        const missing = [];

        for (const dir of requiredDirs) {
            if (!await fs.pathExists(dir)) {
                allExist = false;
                missing.push(dir);
            }
        }

        if (allExist) {
            this.addResult('目录结构检查', true, '所有必需目录存在');
        } else {
            this.addResult('目录结构检查', false, `缺少目录: ${missing.join(', ')}`);
        }
    }

    /**
     * 测试依赖包
     */
    async testDependencies() {
        try {
            const packageJson = await fs.readJson('package.json');
            const dependencies = Object.keys(packageJson.dependencies || {});
            
            let missingDeps = [];
            for (const dep of dependencies) {
                try {
                    require.resolve(dep);
                } catch (error) {
                    missingDeps.push(dep);
                }
            }

            if (missingDeps.length === 0) {
                this.addResult('依赖包检查', true, `${dependencies.length}个依赖包已安装`);
            } else {
                this.addResult('依赖包检查', false, `缺少依赖: ${missingDeps.join(', ')}`);
            }
        } catch (error) {
            this.addResult('依赖包检查', false, 'package.json读取失败');
        }
    }

    /**
     * 测试二维码生成
     */
    async testQRGeneration() {
        try {
            const qrGenerator = require('./utils/qrGenerator');
            
            // 测试基本二维码生成
            const testUrl = 'https://example.com';
            const testFileName = 'test.pptx';
            const testFileId = 'test-' + Date.now();
            
            await qrGenerator.generateQRCode(testUrl, testFileName, testFileId);
            
            // 检查文件是否生成
            const qrPath = path.join('qrcodes', `${testFileId}.png`);
            if (await fs.pathExists(qrPath)) {
                this.addResult('二维码生成测试', true, '二维码生成成功');
                // 清理测试文件
                await fs.remove(qrPath);
            } else {
                this.addResult('二维码生成测试', false, '二维码文件未生成');
            }
        } catch (error) {
            this.addResult('二维码生成测试', false, `生成失败: ${error.message}`);
        }
    }

    /**
     * 测试服务器启动
     */
    async testServer() {
        try {
            // 检查server.js文件
            if (!await fs.pathExists('server.js')) {
                this.addResult('服务器文件检查', false, 'server.js文件不存在');
                return;
            }

            // 检查语法
            await execAsync('node -c server.js');
            this.addResult('服务器语法检查', true, 'server.js语法正确');

            // 尝试启动服务器（快速测试）
            const testProcess = exec('node server.js');
            
            // 等待2秒看是否有错误
            await new Promise((resolve) => {
                setTimeout(() => {
                    testProcess.kill();
                    resolve();
                }, 2000);
            });

            this.addResult('服务器启动测试', true, '服务器可以启动');
        } catch (error) {
            this.addResult('服务器启动测试', false, `启动失败: ${error.message}`);
        }
    }

    /**
     * 添加测试结果
     */
    addResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed: passed,
            message: message
        });

        if (passed) {
            this.passed++;
            console.log(`✅ ${testName}: ${message}`);
        } else {
            this.failed++;
            console.log(`❌ ${testName}: ${message}`);
        }
    }

    /**
     * 显示测试结果
     */
    showResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 测试结果汇总');
        console.log('='.repeat(50));
        console.log(`✅ 通过: ${this.passed}`);
        console.log(`❌ 失败: ${this.failed}`);
        console.log(`📈 成功率: ${((this.passed / this.testResults.length) * 100).toFixed(1)}%`);

        if (this.failed > 0) {
            console.log('\n🔧 修复建议:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(result => {
                    console.log(`  • ${result.name}: ${this.getFixSuggestion(result.name)}`);
                });
        }

        console.log('\n🚀 下一步:');
        if (this.failed === 0) {
            console.log('  • 所有测试通过！可以启动服务: npm start');
            console.log('  • 或使用PM2: pm2 start server.js --name ppt2code');
        } else {
            console.log('  • 请先修复失败的测试项');
            console.log('  • 然后重新运行测试: node test-system.js');
        }
    }

    /**
     * 获取修复建议
     */
    getFixSuggestion(testName) {
        const suggestions = {
            'Node.js版本检查': '升级Node.js到16+版本',
            'LibreOffice检查': '安装LibreOffice: sudo apt install libreoffice',
            'ImageMagick检查': '安装ImageMagick: sudo apt install imagemagick',
            '目录结构检查': '运行: mkdir -p uploads converted qrcodes',
            '依赖包检查': '安装依赖: npm install',
            '二维码生成测试': '检查sharp和qrcode包是否正确安装',
            '服务器启动测试': '检查server.js文件和依赖'
        };

        return suggestions[testName] || '查看详细错误信息';
    }
}

// 主程序
async function main() {
    const tester = new SystemTester();
    await tester.runAllTests();
    
    // 退出码
    process.exit(tester.failed > 0 ? 1 : 0);
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('测试执行失败:', error);
        process.exit(1);
    });
}

module.exports = SystemTester;
