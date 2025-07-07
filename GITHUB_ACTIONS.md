# GitHub Actions 配置指南

本项目配置了完整的 CI/CD 流水线，支持自动构建、测试和发布 Docker 镜像。

## 🔧 最新更新

- ✅ 修复了 `actions/upload-artifact@v3` 的弃用警告，升级到 v4
- ✅ 修复了 `actions/upload-release-asset@v1` 的弃用问题，改用 `softprops/action-gh-release@v1`
- ✅ 更新了 `github/codeql-action/upload-sarif` 到 v3
- ✅ 优化了多架构构建配置

## 🔄 工作流概览

### 1. CI 工作流 (`.github/workflows/ci.yml`)

**触发条件**: 推送到主分支或创建 Pull Request

**功能**:
- ✅ 多版本 Node.js 测试 (16, 18, 20)
- ✅ 代码质量检查
- ✅ 安全漏洞扫描
- ✅ Docker 镜像构建测试

### 2. Docker 构建工作流 (`.github/workflows/docker-build.yml`)

**触发条件**: 推送到主分支或创建标签

**功能**:
- 🐳 多架构 Docker 镜像构建 (amd64, arm64)
- 📦 推送到 GitHub Container Registry
- 🏷️ 自动标签管理
- 📋 生成部署配置文件

### 3. 发布工作流 (`.github/workflows/release.yml`)

**触发条件**: 创建 Release 或手动触发

**功能**:
- 🧪 完整测试套件
- 🐳 生产级 Docker 镜像
- 📦 部署包生成
- 🔒 安全扫描
- 📋 Release 资产上传

## 🚀 使用指南

### 首次设置

1. **启用 GitHub Packages**
   ```bash
   # 确保仓库设置中启用了 Packages
   # Settings > General > Features > Packages ✅
   ```

2. **配置权限**
   ```bash
   # Settings > Actions > General > Workflow permissions
   # 选择 "Read and write permissions" ✅
   ```

### 开发流程

1. **日常开发**
   ```bash
   git push origin feature-branch
   # 自动触发 CI 检查
   ```

2. **合并到主分支**
   ```bash
   git push origin main
   # 自动构建并推送 Docker 镜像
   ```

3. **发布版本**
   ```bash
   # 方法1: 创建 Release (推荐)
   git tag v1.0.0
   git push origin v1.0.0
   # 在 GitHub 上创建 Release
   
   # 方法2: 手动触发
   # 在 Actions 页面手动运行 Release 工作流
   ```

## 📦 镜像标签策略

### 自动标签

- `latest` - 主分支最新版本
- `main` - 主分支构建
- `develop` - 开发分支构建
- `v1.0.0` - 语义化版本标签
- `v1.0` - 主要.次要版本
- `v1` - 主要版本

### 镜像地址

```bash
# GitHub Container Registry
ghcr.io/your-username/ppt2code:latest
ghcr.io/your-username/ppt2code:v1.0.0
```

## 🛠️ 本地测试

### 测试 Docker 构建

```bash
# 构建镜像
docker build -t ppt2code:local .

# 运行测试
docker run --rm -d --name ppt2code-test -p 3000:3000 ppt2code:local
sleep 30
curl -f http://localhost:3000/
docker stop ppt2code-test
```

### 测试多架构构建

```bash
# 设置 buildx
docker buildx create --use

# 构建多架构镜像
docker buildx build --platform linux/amd64,linux/arm64 -t ppt2code:multi .
```

## 📋 部署包使用

### 自动生成的部署包

每次发布都会生成 `ppt2code-deployment.tar.gz` 包含:

```
deployment/
├── docker-compose.prod.yml    # 生产环境配置
├── nginx.conf                 # Nginx 配置
├── deploy.sh                  # 自动部署脚本
└── README.md                  # 部署说明
```

### 使用部署包

```bash
# 1. 下载部署包
wget https://github.com/your-username/ppt2code/releases/latest/download/ppt2code-deployment.tar.gz

# 2. 解压
tar -xzf ppt2code-deployment.tar.gz
cd deployment

# 3. 部署
./deploy.sh
```

## 🔧 自定义配置

### 修改构建参数

编辑 `.github/workflows/docker-build.yml`:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64  # 修改支持的架构
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    build-args: |
      NODE_VERSION=18                    # 修改 Node.js 版本
```

### 添加环境变量

在仓库设置中添加 Secrets:

```bash
# Settings > Secrets and variables > Actions
DOCKER_REGISTRY_URL=your-registry.com
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
```

### 修改镜像仓库

编辑工作流文件中的环境变量:

```yaml
env:
  REGISTRY: your-registry.com        # 修改为你的镜像仓库
  IMAGE_NAME: your-org/ppt2code      # 修改镜像名称
```

## 🔍 故障排除

### 常见问题

1. **权限错误**
   ```bash
   # 检查 GITHUB_TOKEN 权限
   # Settings > Actions > General > Workflow permissions
   ```

2. **构建失败**
   ```bash
   # 查看 Actions 日志
   # 检查 Dockerfile 语法
   # 验证依赖安装
   ```

3. **推送失败**
   ```bash
   # 检查 Container Registry 设置
   # 验证包权限配置
   ```

### 调试技巧

1. **本地复现**
   ```bash
   # 使用相同的构建命令
   docker build --platform linux/amd64 -t test .
   ```

2. **查看详细日志**
   ```bash
   # 在工作流中添加调试步骤
   - name: Debug info
     run: |
       docker --version
       docker buildx version
       env | grep GITHUB
   ```

## 📊 监控和维护

### 定期任务

1. **更新依赖**
   ```bash
   # 定期更新 GitHub Actions 版本
   # 更新 Node.js 版本
   # 更新基础镜像版本
   ```

2. **安全扫描**
   ```bash
   # 查看 Security 标签页
   # 处理 Dependabot 警告
   # 查看 Trivy 扫描结果
   ```

3. **清理旧镜像**
   ```bash
   # 在 Packages 页面删除旧版本
   # 配置自动清理策略
   ```

## 🎯 最佳实践

1. **版本管理**
   - 使用语义化版本号
   - 为重要版本创建 Release
   - 维护 CHANGELOG

2. **安全性**
   - 定期更新依赖
   - 使用最小权限原则
   - 启用安全扫描

3. **性能优化**
   - 使用多阶段构建
   - 优化 .dockerignore
   - 启用构建缓存

通过这套完整的 CI/CD 流水线，你可以实现从代码提交到生产部署的全自动化流程！
