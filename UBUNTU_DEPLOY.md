# Ubuntu 24 部署指南

## 🚀 快速部署

### 方法一：自动部署脚本（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url> ppt2code
cd ppt2code

# 2. 运行自动部署脚本
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh

# 3. 启动服务
sudo systemctl start ppt2code
```

### 方法二：Docker部署

```bash
# 1. 安装Docker和Docker Compose
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# 2. 构建并启动容器
docker-compose up -d

# 3. 查看状态
docker-compose ps
docker-compose logs -f ppt2code
```

### 方法三：手动部署

```bash
# 1. 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装LibreOffice
sudo apt-get install -y libreoffice

# 3. 安装ImageMagick
sudo apt-get install -y imagemagick

# 4. 安装项目依赖
npm install

# 5. 启动服务
npm start
```

## 📋 功能特性

### ✅ 已实现功能

- **批量上传**: 支持同时上传多个PPT文件
- **二维码样式自定义**:
  - 4种样式风格：默认、圆角、渐变背景、阴影效果
  - 自定义颜色：前景色、背景色、文字颜色
  - 可调节大小：二维码大小、文字大小
  - 字体选择：Arial、微软雅黑、黑体、Times New Roman
- **文件名对应**: 二维码图片名称与PPT文件名一一对应
- **在线预览**: 扫码后可在线预览PPT内容
- **移动端友好**: 响应式设计，支持手机扫码预览

### 🎨 二维码样式选项

1. **默认样式**: 经典黑白二维码
2. **圆角样式**: 带圆角的现代化设计
3. **渐变背景**: 渐变色背景，更美观
4. **阴影效果**: 带阴影的立体效果

### 📱 使用流程

1. 访问网站主页
2. 选择二维码样式和颜色
3. 上传PPT文件（单个或批量）
4. 系统自动生成对应的二维码
5. 下载二维码图片
6. 扫码即可在线预览PPT

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：

```bash
# 服务器配置
PORT=3000
HOST=0.0.0.0

# 文件上传限制
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES_PER_BATCH=100

# 二维码默认设置
DEFAULT_QR_SIZE=300
DEFAULT_IMAGE_WIDTH=400
DEFAULT_IMAGE_HEIGHT=450
```

### Nginx配置

如果使用Nginx作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 批量处理

### 使用Web界面批量上传

1. 点击"选择多个文件"
2. 选择多个PPT文件（最多100个）
3. 设置统一的二维码样式
4. 点击上传，系统自动处理所有文件

### 使用命令行批量处理

```bash
# 将PPT文件放在source-ppts目录
mkdir source-ppts
cp /path/to/your/ppts/* source-ppts/

# 运行批量处理脚本
npm run batch

# 或者指定参数
node batch-process.js --source ./my-ppts --url https://your-domain.com
```

## 🛠️ 故障排除

### 常见问题

1. **LibreOffice转换失败**
   ```bash
   # 检查LibreOffice安装
   soffice --version
   
   # 重新安装
   sudo apt-get install --reinstall libreoffice
   ```

2. **端口被占用**
   ```bash
   # 查看端口占用
   sudo netstat -tlnp | grep :3000
   
   # 修改端口
   PORT=3001 npm start
   ```

3. **文件权限问题**
   ```bash
   # 设置正确权限
   sudo chown -R $USER:$USER uploads converted qrcodes
   chmod 755 uploads converted qrcodes
   ```

4. **内存不足**
   ```bash
   # 增加Node.js内存限制
   node --max-old-space-size=4096 server.js
   ```

### 日志查看

```bash
# systemd服务日志
sudo journalctl -u ppt2code -f

# Docker日志
docker-compose logs -f ppt2code

# PM2日志
pm2 logs ppt2code
```

## 🔒 安全建议

1. **防火墙设置**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **文件类型验证**: 系统已内置PPT文件类型检查

3. **文件大小限制**: 默认限制50MB，可在配置中调整

4. **定期清理**: 设置定时任务清理临时文件
   ```bash
   # 添加到crontab
   0 2 * * * cd /path/to/ppt2code && npm run cleanup
   ```

## 📈 性能优化

1. **并发处理**: 默认同时处理3个文件，可根据服务器性能调整

2. **缓存设置**: Nginx已配置静态文件缓存

3. **进程管理**: 使用PM2管理Node.js进程
   ```bash
   pm2 start server.js --name ppt2code -i max
   ```

## 🌐 域名和SSL

### 配置域名

1. 将域名解析到服务器IP
2. 修改Nginx配置中的server_name
3. 重启Nginx服务

### 配置SSL证书

```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📞 技术支持

- 查看日志文件排查问题
- 检查系统资源使用情况
- 确认所有依赖正确安装
- 验证网络连接和端口开放

部署完成后，访问 `http://your-server-ip:3000` 开始使用！
