# PPT2Code 安装指南

## 系统要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- LibreOffice (用于PPT转换)
- ImageMagick (可选，用于图片处理)

## 安装步骤

### 1. 安装 Node.js

#### Windows:
1. 访问 [Node.js官网](https://nodejs.org/)
2. 下载并安装 LTS 版本
3. 验证安装：
```bash
node --version
npm --version
```

#### macOS:
```bash
# 使用 Homebrew
brew install node

# 或者下载官方安装包
```

#### Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 安装 LibreOffice

#### Windows:
1. 访问 [LibreOffice官网](https://www.libreoffice.org/)
2. 下载并安装最新版本
3. 确保 `soffice` 命令在系统PATH中

#### macOS:
```bash
brew install --cask libreoffice
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install libreoffice
```

### 3. 安装 ImageMagick (可选)

#### Windows:
1. 访问 [ImageMagick官网](https://imagemagick.org/script/download.php#windows)
2. 下载并安装适合你系统的版本

#### macOS:
```bash
brew install imagemagick
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get install imagemagick
```

### 4. 安装项目依赖

在项目根目录运行：

```bash
# 安装依赖
npm install

# 或使用 yarn
yarn install
```

### 5. 配置环境

创建 `.env` 文件（可选）：

```bash
# 服务器端口
PORT=3000

# 文件大小限制 (MB)
MAX_FILE_SIZE=50

# 临时文件清理时间 (小时)
CLEANUP_INTERVAL=24
```

## 运行项目

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

访问 `http://localhost:3000` 查看应用。

## 目录结构

```
ppt2code/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── public/                # 静态文件
│   ├── index.html        # 主页面
│   ├── preview.html      # PPT预览页面
│   ├── css/              # 样式文件
│   └── js/               # JavaScript文件
├── uploads/              # 上传的PPT文件
├── converted/            # 转换后的文件
├── qrcodes/             # 生成的二维码图片
└── utils/               # 工具函数
    ├── pptConverter.js  # PPT转换工具
    ├── qrGenerator.js   # 二维码生成工具
    └── fileHandler.js   # 文件处理工具
```

## 故障排除

### 1. LibreOffice 转换失败

**问题**: PPT转换失败，显示 "LibreOffice不可用"

**解决方案**:
- 确保 LibreOffice 已正确安装
- 检查 `soffice` 命令是否在系统PATH中
- Windows用户可能需要重启命令行或系统

**测试命令**:
```bash
soffice --version
```

### 2. 图片转换失败

**问题**: PDF转图片失败

**解决方案**:
- 安装 ImageMagick
- 或者系统会自动使用备用方案（HTML预览）

### 3. 端口占用

**问题**: 端口3000已被占用

**解决方案**:
```bash
# 修改端口
PORT=3001 npm start

# 或者杀死占用端口的进程
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### 4. 文件上传失败

**问题**: 文件上传时出错

**解决方案**:
- 检查文件格式（只支持.ppt和.pptx）
- 检查文件大小（默认限制50MB）
- 确保uploads目录有写权限

### 5. 二维码生成失败

**问题**: 二维码图片无法生成

**解决方案**:
- 检查qrcodes目录权限
- 确保sharp库正确安装
- 重新安装依赖：`npm install sharp`

## 性能优化

### 1. 批量处理优化

对于大量文件的批量处理：

```javascript
// 在 server.js 中调整并发数量
const maxConcurrent = 5; // 同时处理的文件数量
```

### 2. 内存优化

```javascript
// 增加Node.js内存限制
node --max-old-space-size=4096 server.js
```

### 3. 文件清理

定期清理临时文件：

```bash
# 手动清理
npm run cleanup

# 或者设置定时任务
```

## 部署建议

### 1. 使用 PM2 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "ppt2code"

# 设置开机自启
pm2 startup
pm2 save
```

### 2. 使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM node:16-alpine

# 安装 LibreOffice
RUN apk add --no-cache libreoffice

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### 3. 反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 安全建议

1. **文件类型验证**: 只允许.ppt和.pptx文件
2. **文件大小限制**: 设置合理的文件大小限制
3. **定期清理**: 定期清理临时文件
4. **访问控制**: 在生产环境中添加身份验证
5. **HTTPS**: 使用HTTPS保护数据传输

## 支持

如果遇到问题，请检查：

1. Node.js 和 npm 版本
2. LibreOffice 安装状态
3. 系统权限设置
4. 防火墙和端口设置
5. 日志文件中的错误信息

更多帮助请查看项目文档或提交Issue。
