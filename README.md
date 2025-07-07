# PPT2Code - PPT转二维码在线预览系统

🚀 将服务器上的PPT文件转换为可扫码在线预览的二维码图片系统，专为Ubuntu 24部署优化。

## ✨ 核心功能

### 📄 文件处理
- **批量上传**: 支持同时上传多达100个PPT文件
- **智能转换**: 自动将PPT转换为在线预览格式
- **文件名对应**: 生成的二维码文件名与PPT文件名一一对应

### 🎨 二维码样式自定义
- **4种风格**: 默认、圆角、渐变背景、阴影效果
- **颜色自定义**: 前景色、背景色、文字颜色可调
- **尺寸调节**: 二维码大小、文字大小可调
- **字体选择**: 支持多种中英文字体

### 📱 在线预览
- **移动端优化**: 响应式设计，完美支持手机扫码
- **幻灯片导航**: 支持键盘和触摸导航
- **全屏模式**: 支持全屏预览PPT内容

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **文件处理**: LibreOffice + ImageMagick
- **二维码生成**: qrcode + sharp
- **图片处理**: Sharp (高性能图像处理)
- **前端**: 原生HTML/CSS/JavaScript
- **部署**: Ubuntu 24 + Docker + Nginx

## 🚀 快速部署 (Ubuntu 24)

### 方法一：一键自动部署 (推荐)

```bash
# 克隆项目
git clone <your-repo-url> ppt2code
cd ppt2code

# 运行自动部署脚本
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh

# 启动服务
sudo systemctl start ppt2code
```

### 方法二：Docker部署

```bash
# 使用Docker Compose
docker-compose up -d

# 查看状态
docker-compose ps
```

### 方法三：手动安装

```bash
# 安装依赖
npm install

# 系统测试
npm test

# 启动服务
npm start
```

访问 `http://localhost:3000` 开始使用！

## 项目结构

```
ppt2code/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── public/                # 静态文件
│   ├── index.html        # 主页面
│   ├── preview.html      # PPT预览页面
│   └── css/              # 样式文件
├── uploads/              # 上传的PPT文件
├── converted/            # 转换后的文件
├── qrcodes/             # 生成的二维码图片
└── utils/               # 工具函数
    ├── pptConverter.js  # PPT转换工具
    ├── qrGenerator.js   # 二维码生成工具
    └── fileHandler.js   # 文件处理工具
```

## API 接口

- `POST /upload` - 上传PPT文件
- `POST /batch-upload` - 批量上传PPT文件
- `GET /preview/:id` - 预览PPT内容
- `GET /qrcode/:id` - 获取二维码图片
- `POST /generate-qr` - 生成二维码

## 📖 使用说明

### 🎯 基本流程

1. **访问网站**: 打开 `http://your-server:3000`
2. **设置样式**: 选择二维码风格、颜色、大小等
3. **上传文件**: 单个或批量上传PPT文件
4. **自动处理**: 系统自动转换并生成二维码
5. **下载使用**: 下载二维码图片，扫码预览

### 🎨 样式自定义

- **风格选择**: 默认、圆角、渐变、阴影四种风格
- **颜色设置**: 自定义前景色、背景色、文字颜色
- **尺寸调节**: 二维码大小200-400px，文字12-24px
- **字体选择**: Arial、微软雅黑、黑体、Times New Roman

### 📦 批量处理

- **Web界面**: 最多同时上传100个PPT文件
- **命令行**: 使用 `npm run batch` 处理本地文件
- **统一样式**: 批量文件使用相同的二维码样式

### 📱 扫码预览

- **移动优化**: 完美支持手机扫码和预览
- **导航功能**: 支持滑动、点击、键盘导航
- **全屏模式**: 按F键或点击全屏按钮

## 🔧 高级功能

### 📊 批量处理命令行

```bash
# 处理指定目录的PPT文件
npm run batch -- --source ./my-ppts --url https://your-domain.com

# 设置并发数量
npm run batch -- --concurrent 5

# 查看帮助
npm run batch -- --help
```

### 🧪 系统测试

```bash
# 运行完整系统测试
npm test

# 检查所有依赖和配置
npm run test:system
```

### 🧹 维护命令

```bash
# 清理临时文件
npm run cleanup

# 查看系统状态
sudo systemctl status ppt2code

# 查看日志
sudo journalctl -u ppt2code -f
```

## 📋 API接口

- `POST /upload` - 单文件上传
- `POST /batch-upload` - 批量文件上传
- `GET /preview/:id` - PPT预览页面
- `GET /api/preview/:id` - 获取预览数据
- `GET /qrcode/:id` - 获取二维码图片

## 🔒 安全特性

- ✅ 文件类型验证（仅支持.ppt/.pptx）
- ✅ 文件大小限制（默认50MB）
- ✅ 自动清理临时文件
- ✅ 防火墙配置支持
- ✅ Nginx反向代理配置

## 📈 性能优化

- ⚡ 并发处理支持
- 🗜️ 图片压缩优化
- 💾 静态文件缓存
- 🔄 进程管理(PM2)
- 📊 资源监控

## 🆘 故障排除

详细的故障排除指南请查看 [UBUNTU_DEPLOY.md](./UBUNTU_DEPLOY.md)

常见问题：
- LibreOffice安装问题
- 端口占用问题
- 文件权限问题
- 内存不足问题

## 📞 技术支持

- 📖 查看 [安装指南](./INSTALL.md)
- 🐧 查看 [Ubuntu部署指南](./UBUNTU_DEPLOY.md)
- 🧪 运行系统测试: `npm test`
- 📋 查看日志文件排查问题

---

**🎉 部署完成后，你将拥有一个功能完整的PPT转二维码系统！**
