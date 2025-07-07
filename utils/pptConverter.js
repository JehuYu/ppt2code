const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class PPTConverter {
  constructor() {
    this.convertedDir = path.join(__dirname, '..', 'converted');
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
  }

  /**
   * 将PPT文件转换为PDF，然后转换为图片
   * @param {string} pptPath - PPT文件路径
   * @param {string} fileId - 文件ID
   * @returns {Promise<string>} - 转换后的文件路径
   */
  async convertPPT(pptPath, fileId) {
    try {
      // 确保转换目录存在
      await fs.ensureDir(this.convertedDir);
      const outputDir = path.join(this.convertedDir, fileId);
      await fs.ensureDir(outputDir);

      // 方法1: 使用LibreOffice转换为PDF
      const pdfPath = await this.convertToPDF(pptPath, outputDir);
      
      // 方法2: 将PDF转换为图片
      const imagesPath = await this.convertPDFToImages(pdfPath, outputDir);
      
      return imagesPath;
    } catch (error) {
      console.error('PPT转换错误:', error);
      throw new Error(`PPT转换失败: ${error.message}`);
    }
  }

  /**
   * 使用LibreOffice将PPT转换为PDF
   * @param {string} pptPath - PPT文件路径
   * @param {string} outputDir - 输出目录
   * @returns {Promise<string>} - PDF文件路径
   */
  async convertToPDF(pptPath, outputDir) {
    try {
      // LibreOffice命令行转换
      const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${pptPath}"`;
      
      console.log('执行转换命令:', command);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Warning')) {
        console.warn('LibreOffice警告:', stderr);
      }
      
      // 查找生成的PDF文件
      const files = await fs.readdir(outputDir);
      const pdfFile = files.find(file => file.endsWith('.pdf'));
      
      if (!pdfFile) {
        throw new Error('PDF转换失败，未找到输出文件');
      }
      
      return path.join(outputDir, pdfFile);
    } catch (error) {
      console.error('PDF转换错误:', error);
      // 如果LibreOffice不可用，使用备用方案
      return this.fallbackConversion(pptPath, outputDir);
    }
  }

  /**
   * 将PDF转换为图片
   * @param {string} pdfPath - PDF文件路径
   * @param {string} outputDir - 输出目录
   * @returns {Promise<string>} - 图片目录路径
   */
  async convertPDFToImages(pdfPath, outputDir) {
    try {
      const imagesDir = path.join(outputDir, 'images');
      await fs.ensureDir(imagesDir);

      // 使用pdf-poppler或其他工具转换PDF为图片
      // 这里提供一个简化的实现
      const command = `magick convert -density 150 "${pdfPath}" "${path.join(imagesDir, 'slide-%03d.png')}"`;
      
      try {
        await execAsync(command);
      } catch (error) {
        // 如果ImageMagick不可用，创建一个占位符
        console.warn('ImageMagick不可用，创建占位符图片');
        await this.createPlaceholderImages(imagesDir);
      }
      
      return imagesDir;
    } catch (error) {
      console.error('图片转换错误:', error);
      throw error;
    }
  }

  /**
   * 备用转换方案（当LibreOffice不可用时）
   * @param {string} pptPath - PPT文件路径
   * @param {string} outputDir - 输出目录
   * @returns {Promise<string>} - 转换结果路径
   */
  async fallbackConversion(pptPath, outputDir) {
    console.log('使用备用转换方案');
    
    // 创建一个简单的HTML预览文件
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>PPT预览</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .placeholder { 
                border: 2px dashed #ccc; 
                padding: 50px; 
                margin: 20px 0; 
                background: #f9f9f9; 
            }
        </style>
    </head>
    <body>
        <h1>PPT文件预览</h1>
        <div class="placeholder">
            <p>PPT文件已上传成功</p>
            <p>文件名: ${path.basename(pptPath)}</p>
            <p>注意: 需要安装LibreOffice以获得完整的预览功能</p>
        </div>
    </body>
    </html>`;
    
    const htmlPath = path.join(outputDir, 'preview.html');
    await fs.writeFile(htmlPath, htmlContent);
    
    return htmlPath;
  }

  /**
   * 创建占位符图片
   * @param {string} imagesDir - 图片目录
   */
  async createPlaceholderImages(imagesDir) {
    // 创建一个简单的占位符文件
    const placeholderContent = 'PPT slide placeholder';
    await fs.writeFile(path.join(imagesDir, 'slide-001.txt'), placeholderContent);
  }

  /**
   * 获取转换后的文件信息
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} - 文件信息
   */
  async getConvertedFileInfo(fileId) {
    const outputDir = path.join(this.convertedDir, fileId);
    
    if (!await fs.pathExists(outputDir)) {
      throw new Error('转换文件不存在');
    }
    
    const imagesDir = path.join(outputDir, 'images');
    let slides = [];
    
    if (await fs.pathExists(imagesDir)) {
      const files = await fs.readdir(imagesDir);
      slides = files
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
        .sort()
        .map(file => `/converted/${fileId}/images/${file}`);
    }
    
    return {
      fileId,
      slides,
      totalSlides: slides.length
    };
  }
}

module.exports = new PPTConverter();
