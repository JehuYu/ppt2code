# Docker 构建和部署指南

## 🐳 快速开始

### 1. 本地构建和测试

```bash
# 构建镜像
./docker-build.sh latest build

# 构建并测试
./docker-build.sh latest test

# 运行容器
./docker-build.sh latest run
```

### 2. 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 3. 使用 npm 脚本

```bash
# 构建镜像
npm run docker:build

# 测试镜像
npm run docker:test

# 运行容器
npm run docker:run

# 使用 compose
npm run docker:compose
```

## 📦 GitHub Actions 自动构建

### 触发构建

```bash
# 推送到主分支触发构建
git push origin main

# 创建标签触发版本构建
git tag v1.0.0
git push origin v1.0.0
```

### 镜像地址

构建完成后，镜像将推送到 GitHub Container Registry：

```bash
# 拉取最新镜像
docker pull ghcr.io/your-username/ppt2code:latest

# 拉取指定版本
docker pull ghcr.io/your-username/ppt2code:v1.0.0
```

## 🚀 生产部署

### 使用预构建镜像

```bash
# 创建数据目录
mkdir -p data/{uploads,converted,qrcodes,logs}

# 运行容器
docker run -d \
  --name ppt2code \
  -p 3000:3000 \
  -v $(pwd)/data/uploads:/app/uploads \
  -v $(pwd)/data/converted:/app/converted \
  -v $(pwd)/data/qrcodes:/app/qrcodes \
  -v $(pwd)/data/logs:/app/logs \
  --restart unless-stopped \
  ghcr.io/your-username/ppt2code:latest
```

### 使用 Docker Compose

```yaml
version: '3.8'
services:
  ppt2code:
    image: ghcr.io/your-username/ppt2code:latest
    container_name: ppt2code-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TZ=Asia/Shanghai
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/converted:/app/converted
      - ./data/qrcodes:/app/qrcodes
      - ./data/logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 🔧 构建脚本使用

### 基本命令

```bash
# 显示帮助
./docker-build.sh help

# 构建镜像
./docker-build.sh v1.0.0 build

# 构建并测试
./docker-build.sh latest test

# 推送镜像 (需要先登录)
./docker-build.sh v1.0.0 push

# 运行容器
./docker-build.sh latest run

# 清理镜像和容器
./docker-build.sh latest clean
```

### 环境变量

```bash
# 设置镜像仓库
export REGISTRY=ghcr.io/your-username

# 构建并推送
./docker-build.sh v1.0.0 push
```

## 📊 监控和维护

### 查看容器状态

```bash
# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 查看容器日志
docker logs ppt2code

# 实时查看日志
docker logs -f ppt2code
```

### 容器管理

```bash
# 重启容器
docker restart ppt2code

# 停止容器
docker stop ppt2code

# 删除容器
docker rm ppt2code

# 进入容器
docker exec -it ppt2code bash
```

### 镜像管理

```bash
# 查看镜像
docker images ppt2code

# 删除镜像
docker rmi ppt2code:latest

# 清理未使用的镜像
docker image prune
```

## 🔍 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 查看构建日志
   docker build --no-cache -t ppt2code .
   ```

2. **容器启动失败**
   ```bash
   # 查看容器日志
   docker logs ppt2code
   
   # 检查端口占用
   netstat -tlnp | grep :3000
   ```

3. **权限问题**
   ```bash
   # 检查数据目录权限
   ls -la data/
   
   # 修复权限
   sudo chown -R 1000:1000 data/
   ```

4. **健康检查失败**
   ```bash
   # 手动测试健康检查
   curl -f http://localhost:3000/
   
   # 查看容器内部
   docker exec -it ppt2code curl -f http://localhost:3000/
   ```

### 调试技巧

1. **交互式运行**
   ```bash
   # 交互式启动容器
   docker run -it --rm ppt2code bash
   ```

2. **挂载源码调试**
   ```bash
   # 开发模式运行
   docker run -it --rm \
     -p 3000:3000 \
     -v $(pwd):/app \
     node:18-bullseye-slim \
     bash
   ```

3. **查看镜像层**
   ```bash
   # 分析镜像
   docker history ppt2code:latest
   
   # 查看镜像详情
   docker inspect ppt2code:latest
   ```

## 📋 最佳实践

1. **版本管理**
   - 使用语义化版本号
   - 为每个版本创建标签
   - 保持 latest 标签为稳定版本

2. **安全性**
   - 使用非 root 用户运行
   - 定期更新基础镜像
   - 扫描镜像漏洞

3. **性能优化**
   - 使用多阶段构建
   - 优化 .dockerignore
   - 启用构建缓存

4. **监控**
   - 配置健康检查
   - 监控容器资源使用
   - 设置日志轮转

通过这套 Docker 配置，你可以轻松构建、测试和部署 PPT2Code 应用！
