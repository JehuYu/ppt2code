const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

// 导入工具模块
const pptConverter = require('./utils/pptConverter');
const qrGenerator = require('./utils/qrGenerator');
const fileHandler = require('./utils/fileHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/qrcodes', express.static('qrcodes'));
app.use('/converted', express.static('converted'));

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ppt', '.pptx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('只支持PPT和PPTX文件格式'));
    }
  }
});

// 路由

// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 单个文件上传
app.post('/upload', upload.single('pptFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择PPT文件' });
    }

    const fileId = path.parse(req.file.filename).name;
    const originalName = req.file.originalname;

    // 获取样式选项
    let styleOptions = {};
    if (req.body.styleOptions) {
      try {
        styleOptions = JSON.parse(req.body.styleOptions);
      } catch (e) {
        console.warn('样式选项解析失败:', e.message);
      }
    }

    // 转换PPT为预览格式
    const convertedPath = await pptConverter.convertPPT(req.file.path, fileId);

    // 生成预览链接
    const previewUrl = `${req.protocol}://${req.get('host')}/preview/${fileId}`;

    // 生成二维码（带样式选项）
    const qrCodePath = await qrGenerator.generateQRCode(previewUrl, originalName, fileId, styleOptions);

    res.json({
      success: true,
      fileId: fileId,
      originalName: originalName,
      previewUrl: previewUrl,
      qrCodeUrl: `/qrcodes/${fileId}.png`,
      styleOptions: styleOptions
    });

  } catch (error) {
    console.error('文件处理错误:', error);
    res.status(500).json({ error: '文件处理失败: ' + error.message });
  }
});

// 批量文件上传
app.post('/batch-upload', upload.array('pptFiles', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请选择PPT文件' });
    }

    // 获取样式选项
    let styleOptions = {};
    if (req.body.styleOptions) {
      try {
        styleOptions = JSON.parse(req.body.styleOptions);
      } catch (e) {
        console.warn('样式选项解析失败:', e.message);
      }
    }

    const results = [];

    for (const file of req.files) {
      try {
        const fileId = path.parse(file.filename).name;
        const originalName = file.originalname;

        // 转换PPT
        const convertedPath = await pptConverter.convertPPT(file.path, fileId);

        // 生成预览链接
        const previewUrl = `${req.protocol}://${req.get('host')}/preview/${fileId}`;

        // 生成二维码（带样式选项）
        const qrCodePath = await qrGenerator.generateQRCode(previewUrl, originalName, fileId, styleOptions);

        results.push({
          success: true,
          fileId: fileId,
          originalName: originalName,
          previewUrl: previewUrl,
          qrCodeUrl: `/qrcodes/${fileId}.png`
        });

      } catch (error) {
        results.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      totalFiles: req.files.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results: results,
      styleOptions: styleOptions
    });

  } catch (error) {
    console.error('批量处理错误:', error);
    res.status(500).json({ error: '批量处理失败: ' + error.message });
  }
});

// PPT预览页面
app.get('/preview/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  res.sendFile(path.join(__dirname, 'public', 'preview.html'));
});

// 获取PPT预览数据
app.get('/api/preview/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const previewData = await fileHandler.getPreviewData(fileId);
    res.json(previewData);
  } catch (error) {
    res.status(404).json({ error: '文件未找到' });
  }
});

// 获取二维码图片
app.get('/qrcode/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const qrCodePath = path.join(__dirname, 'qrcodes', `${fileId}.png`);
  
  if (fs.existsSync(qrCodePath)) {
    res.sendFile(qrCodePath);
  } else {
    res.status(404).json({ error: '二维码未找到' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('PPT2Code 系统已启动！');
});

module.exports = app;
