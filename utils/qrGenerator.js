const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

class QRGenerator {
  constructor() {
    this.qrCodesDir = path.join(__dirname, '..', 'qrcodes');
    this.defaultOptions = {
      qrSize: 300,
      imageWidth: 400,
      imageHeight: 450,
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      logoSize: 60,
      borderRadius: 10,
      textColor: '#333333',
      textSize: 16,
      textFont: 'Arial',
      style: 'default' // default, rounded, gradient, shadow
    };
  }

  /**
   * 生成包含文件名的二维码图片
   * @param {string} url - 要编码的URL
   * @param {string} fileName - PPT文件名
   * @param {string} fileId - 文件ID
   * @param {Object} customOptions - 自定义样式选项
   * @returns {Promise<string>} - 生成的二维码图片路径
   */
  async generateQRCode(url, fileName, fileId, customOptions = {}) {
    try {
      // 确保二维码目录存在
      await fs.ensureDir(this.qrCodesDir);

      // 合并选项
      const options = { ...this.defaultOptions, ...customOptions };

      // 生成二维码
      const qrCodeBuffer = await this.createQRCode(url, options);

      // 创建带文件名的图片
      const finalImagePath = await this.createImageWithText(qrCodeBuffer, fileName, fileId, options);

      console.log(`二维码生成成功: ${finalImagePath}`);
      return finalImagePath;
    } catch (error) {
      console.error('二维码生成错误:', error);
      throw new Error(`二维码生成失败: ${error.message}`);
    }
  }

  /**
   * 创建二维码
   * @param {string} url - 要编码的URL
   * @param {Object} options - 样式选项
   * @returns {Promise<Buffer>} - 二维码图片Buffer
   */
  async createQRCode(url, options) {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(url, {
        type: 'png',
        width: options.qrSize,
        margin: 2,
        color: {
          dark: options.foregroundColor,
          light: options.backgroundColor
        },
        errorCorrectionLevel: 'M'
      });

      return qrCodeBuffer;
    } catch (error) {
      throw new Error(`二维码创建失败: ${error.message}`);
    }
  }

  /**
   * 创建包含文件名的图片
   * @param {Buffer} qrCodeBuffer - 二维码图片Buffer
   * @param {string} fileName - 文件名
   * @param {string} fileId - 文件ID
   * @param {Object} options - 样式选项
   * @returns {Promise<string>} - 最终图片路径
   */
  async createImageWithText(qrCodeBuffer, fileName, fileId, options) {
    try {
      // 处理文件名，去掉扩展名并限制长度
      const displayName = this.formatFileName(fileName);

      // 根据样式创建背景
      let background;
      if (options.style === 'gradient') {
        background = await this.createGradientBackground(options);
      } else {
        background = sharp({
          create: {
            width: options.imageWidth,
            height: options.imageHeight,
            channels: 3,
            background: this.hexToRgb(options.backgroundColor)
          }
        });
      }

      // 处理二维码样式
      let processedQR = qrCodeBuffer;
      if (options.style === 'rounded') {
        processedQR = await this.addRoundedCorners(qrCodeBuffer, options);
      } else if (options.style === 'shadow') {
        processedQR = await this.addShadow(qrCodeBuffer, options);
      }

      // 创建文本SVG
      const textSvg = this.createTextSVG(displayName, options);

      // 计算位置
      const qrX = Math.floor((options.imageWidth - options.qrSize) / 2);
      const qrY = 60; // 从顶部留出更多空间给文本
      const bottomTextY = qrY + options.qrSize + 20; // 底部文本位置

      // 合成图层
      const compositeArray = [
        {
          input: Buffer.from(textSvg),
          top: 15,
          left: 0
        },
        {
          input: processedQR,
          top: qrY,
          left: qrX
        }
      ];

      // 添加底部说明文字
      const bottomTextSvg = this.createBottomTextSVG(options);
      compositeArray.push({
        input: Buffer.from(bottomTextSvg),
        top: bottomTextY,
        left: 0
      });

      // 合成最终图片
      const finalImage = await background
        .composite(compositeArray)
        .png()
        .toBuffer();

      // 保存图片
      const outputPath = path.join(this.qrCodesDir, `${fileId}.png`);
      await fs.writeFile(outputPath, finalImage);

      return outputPath;
    } catch (error) {
      throw new Error(`图片合成失败: ${error.message}`);
    }
  }

  /**
   * 格式化文件名
   * @param {string} fileName - 原始文件名
   * @returns {string} - 格式化后的文件名
   */
  formatFileName(fileName) {
    // 去掉扩展名
    const nameWithoutExt = path.parse(fileName).name;
    
    // 限制长度
    const maxLength = 25;
    if (nameWithoutExt.length > maxLength) {
      return nameWithoutExt.substring(0, maxLength) + '...';
    }
    
    return nameWithoutExt;
  }

  /**
   * 创建渐变背景
   * @param {Object} options - 样式选项
   * @returns {Promise<Sharp>} - Sharp实例
   */
  async createGradientBackground(options) {
    const gradientSvg = `
      <svg width="${options.imageWidth}" height="${options.imageHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${options.backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
      </svg>
    `;

    return sharp(Buffer.from(gradientSvg));
  }

  /**
   * 添加圆角效果
   * @param {Buffer} qrBuffer - 二维码Buffer
   * @param {Object} options - 样式选项
   * @returns {Promise<Buffer>} - 处理后的Buffer
   */
  async addRoundedCorners(qrBuffer, options) {
    const roundedMask = Buffer.from(`
      <svg width="${options.qrSize}" height="${options.qrSize}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="${options.borderRadius}" ry="${options.borderRadius}" fill="white"/>
      </svg>
    `);

    return await sharp(qrBuffer)
      .composite([{ input: roundedMask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  /**
   * 添加阴影效果
   * @param {Buffer} qrBuffer - 二维码Buffer
   * @param {Object} options - 样式选项
   * @returns {Promise<Buffer>} - 处理后的Buffer
   */
  async addShadow(qrBuffer, options) {
    const shadowSize = 10;
    const newSize = options.qrSize + shadowSize * 2;

    const shadowSvg = `
      <svg width="${newSize}" height="${newSize}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${shadowSize + 3}" y="${shadowSize + 3}" width="${options.qrSize}" height="${options.qrSize}"
              fill="rgba(0,0,0,0.2)" rx="5" ry="5"/>
      </svg>
    `;

    return await sharp({
      create: {
        width: newSize,
        height: newSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      { input: Buffer.from(shadowSvg), top: 0, left: 0 },
      { input: qrBuffer, top: shadowSize, left: shadowSize }
    ])
    .png()
    .toBuffer();
  }

  /**
   * 创建文本SVG
   * @param {string} text - 要显示的文本
   * @param {Object} options - 样式选项
   * @returns {string} - SVG字符串
   */
  createTextSVG(text, options) {
    return `
      <svg width="${options.imageWidth}" height="40" xmlns="http://www.w3.org/2000/svg">
        <text x="${options.imageWidth / 2}" y="25"
              font-family="${options.textFont}, sans-serif"
              font-size="${options.textSize}"
              font-weight="bold"
              fill="${options.textColor}"
              text-anchor="middle"
              dominant-baseline="middle">
          ${this.escapeXml(text)}
        </text>
      </svg>
    `;
  }

  /**
   * 创建底部说明文字
   * @param {Object} options - 样式选项
   * @returns {string} - SVG字符串
   */
  createBottomTextSVG(options) {
    return `
      <svg width="${options.imageWidth}" height="30" xmlns="http://www.w3.org/2000/svg">
        <text x="${options.imageWidth / 2}" y="15"
              font-family="${options.textFont}, sans-serif"
              font-size="12"
              fill="${options.textColor}"
              text-anchor="middle"
              opacity="0.7"
              dominant-baseline="middle">
          扫码预览PPT
        </text>
      </svg>
    `;
  }

  /**
   * 十六进制颜色转RGB
   * @param {string} hex - 十六进制颜色
   * @returns {Object} - RGB对象
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  /**
   * 转义XML字符
   * @param {string} text - 要转义的文本
   * @returns {string} - 转义后的文本
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 批量生成二维码
   * @param {Array} files - 文件信息数组
   * @param {string} baseUrl - 基础URL
   * @returns {Promise<Array>} - 生成结果数组
   */
  async batchGenerateQRCodes(files, baseUrl) {
    const results = [];
    
    for (const file of files) {
      try {
        const previewUrl = `${baseUrl}/preview/${file.fileId}`;
        const qrCodePath = await this.generateQRCode(previewUrl, file.originalName, file.fileId);
        
        results.push({
          success: true,
          fileId: file.fileId,
          originalName: file.originalName,
          qrCodePath: qrCodePath
        });
      } catch (error) {
        results.push({
          success: false,
          fileId: file.fileId,
          originalName: file.originalName,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 获取二维码图片信息
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} - 二维码信息
   */
  async getQRCodeInfo(fileId) {
    const qrCodePath = path.join(this.qrCodesDir, `${fileId}.png`);
    
    if (!await fs.pathExists(qrCodePath)) {
      throw new Error('二维码文件不存在');
    }
    
    const stats = await fs.stat(qrCodePath);
    
    return {
      fileId,
      path: qrCodePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
}

module.exports = new QRGenerator();
