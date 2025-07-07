const fs = require('fs-extra');
const path = require('path');

class FileHandler {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.convertedDir = path.join(__dirname, '..', 'converted');
    this.qrCodesDir = path.join(__dirname, '..', 'qrcodes');
  }

  /**
   * 获取PPT预览数据
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} - 预览数据
   */
  async getPreviewData(fileId) {
    try {
      const convertedPath = path.join(this.convertedDir, fileId);
      
      if (!await fs.pathExists(convertedPath)) {
        throw new Error('文件未找到');
      }

      // 检查是否有图片文件
      const imagesDir = path.join(convertedPath, 'images');
      let slides = [];
      
      if (await fs.pathExists(imagesDir)) {
        const files = await fs.readdir(imagesDir);
        slides = files
          .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
          .sort()
          .map(file => ({
            url: `/converted/${fileId}/images/${file}`,
            name: file
          }));
      }

      // 检查是否有HTML预览文件
      const htmlPreviewPath = path.join(convertedPath, 'preview.html');
      let hasHtmlPreview = false;
      
      if (await fs.pathExists(htmlPreviewPath)) {
        hasHtmlPreview = true;
      }

      // 获取原始文件信息
      const originalFileInfo = await this.getOriginalFileInfo(fileId);

      return {
        fileId,
        slides,
        totalSlides: slides.length,
        hasHtmlPreview,
        htmlPreviewUrl: hasHtmlPreview ? `/converted/${fileId}/preview.html` : null,
        originalFile: originalFileInfo
      };
    } catch (error) {
      console.error('获取预览数据错误:', error);
      throw error;
    }
  }

  /**
   * 获取原始文件信息
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} - 原始文件信息
   */
  async getOriginalFileInfo(fileId) {
    try {
      const files = await fs.readdir(this.uploadsDir);
      const originalFile = files.find(file => file.startsWith(fileId));
      
      if (!originalFile) {
        return null;
      }

      const filePath = path.join(this.uploadsDir, originalFile);
      const stats = await fs.stat(filePath);
      
      return {
        filename: originalFile,
        size: stats.size,
        uploadTime: stats.birthtime,
        path: filePath
      };
    } catch (error) {
      console.error('获取原始文件信息错误:', error);
      return null;
    }
  }

  /**
   * 获取所有已处理的文件列表
   * @returns {Promise<Array>} - 文件列表
   */
  async getAllProcessedFiles() {
    try {
      const convertedFiles = await fs.readdir(this.convertedDir);
      const results = [];

      for (const fileId of convertedFiles) {
        try {
          const previewData = await this.getPreviewData(fileId);
          const qrCodeInfo = await this.getQRCodeInfo(fileId);
          
          results.push({
            ...previewData,
            qrCode: qrCodeInfo
          });
        } catch (error) {
          console.warn(`获取文件 ${fileId} 信息失败:`, error.message);
        }
      }

      return results;
    } catch (error) {
      console.error('获取文件列表错误:', error);
      throw error;
    }
  }

  /**
   * 获取二维码信息
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} - 二维码信息
   */
  async getQRCodeInfo(fileId) {
    try {
      const qrCodePath = path.join(this.qrCodesDir, `${fileId}.png`);
      
      if (!await fs.pathExists(qrCodePath)) {
        return null;
      }

      const stats = await fs.stat(qrCodePath);
      
      return {
        exists: true,
        url: `/qrcodes/${fileId}.png`,
        size: stats.size,
        created: stats.birthtime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 删除文件及其相关数据
   * @param {string} fileId - 文件ID
   * @returns {Promise<boolean>} - 删除是否成功
   */
  async deleteFile(fileId) {
    try {
      const deleteTasks = [];

      // 删除转换后的文件
      const convertedPath = path.join(this.convertedDir, fileId);
      if (await fs.pathExists(convertedPath)) {
        deleteTasks.push(fs.remove(convertedPath));
      }

      // 删除二维码
      const qrCodePath = path.join(this.qrCodesDir, `${fileId}.png`);
      if (await fs.pathExists(qrCodePath)) {
        deleteTasks.push(fs.remove(qrCodePath));
      }

      // 删除原始文件
      const files = await fs.readdir(this.uploadsDir);
      const originalFile = files.find(file => file.startsWith(fileId));
      if (originalFile) {
        const originalPath = path.join(this.uploadsDir, originalFile);
        deleteTasks.push(fs.remove(originalPath));
      }

      await Promise.all(deleteTasks);
      return true;
    } catch (error) {
      console.error('删除文件错误:', error);
      return false;
    }
  }

  /**
   * 清理临时文件
   * @param {number} maxAge - 最大文件年龄（毫秒）
   * @returns {Promise<Object>} - 清理结果
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    try {
      const now = Date.now();
      let deletedCount = 0;
      const errors = [];

      // 清理上传文件
      const uploadFiles = await fs.readdir(this.uploadsDir);
      for (const file of uploadFiles) {
        try {
          const filePath = path.join(this.uploadsDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.birthtime.getTime() > maxAge) {
            await fs.remove(filePath);
            deletedCount++;
          }
        } catch (error) {
          errors.push(`删除上传文件 ${file} 失败: ${error.message}`);
        }
      }

      return {
        success: true,
        deletedCount,
        errors
      };
    } catch (error) {
      console.error('清理临时文件错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取存储统计信息
   * @returns {Promise<Object>} - 存储统计
   */
  async getStorageStats() {
    try {
      const stats = {
        uploads: { count: 0, size: 0 },
        converted: { count: 0, size: 0 },
        qrcodes: { count: 0, size: 0 }
      };

      // 统计上传文件
      if (await fs.pathExists(this.uploadsDir)) {
        const uploadFiles = await fs.readdir(this.uploadsDir);
        stats.uploads.count = uploadFiles.length;
        
        for (const file of uploadFiles) {
          const filePath = path.join(this.uploadsDir, file);
          const fileStat = await fs.stat(filePath);
          stats.uploads.size += fileStat.size;
        }
      }

      // 统计转换文件
      if (await fs.pathExists(this.convertedDir)) {
        const convertedFiles = await fs.readdir(this.convertedDir);
        stats.converted.count = convertedFiles.length;
        
        for (const dir of convertedFiles) {
          const dirPath = path.join(this.convertedDir, dir);
          const dirStat = await fs.stat(dirPath);
          if (dirStat.isDirectory()) {
            const dirSize = await this.getDirectorySize(dirPath);
            stats.converted.size += dirSize;
          }
        }
      }

      // 统计二维码文件
      if (await fs.pathExists(this.qrCodesDir)) {
        const qrFiles = await fs.readdir(this.qrCodesDir);
        stats.qrcodes.count = qrFiles.length;
        
        for (const file of qrFiles) {
          const filePath = path.join(this.qrCodesDir, file);
          const fileStat = await fs.stat(filePath);
          stats.qrcodes.size += fileStat.size;
        }
      }

      return stats;
    } catch (error) {
      console.error('获取存储统计错误:', error);
      throw error;
    }
  }

  /**
   * 获取目录大小
   * @param {string} dirPath - 目录路径
   * @returns {Promise<number>} - 目录大小（字节）
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn('计算目录大小错误:', error);
    }
    
    return totalSize;
  }
}

module.exports = new FileHandler();
