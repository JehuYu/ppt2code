# GitHub Actions 版本修复指南

## 🚨 已修复的弃用问题

### 1. actions/upload-artifact 版本问题

**问题**: `actions/upload-artifact@v3` 已被弃用

**修复**: 
```yaml
# 修复前
- uses: actions/upload-artifact@v3

# 修复后  
- uses: actions/upload-artifact@v4
```

**影响文件**:
- `.github/workflows/docker-build.yml`
- `.github/workflows/release.yml`

### 2. actions/upload-release-asset 版本问题

**问题**: `actions/upload-release-asset@v1` 已被弃用

**修复**:
```yaml
# 修复前
- name: Upload to release
  uses: actions/upload-release-asset@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    upload_url: ${{ github.event.release.upload_url }}
    asset_path: ./ppt2code-deployment.tar.gz
    asset_name: ppt2code-deployment.tar.gz
    asset_content_type: application/gzip

# 修复后
- name: Upload to release
  uses: softprops/action-gh-release@v1
  with:
    files: ppt2code-deployment.tar.gz
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. github/codeql-action 版本更新

**问题**: `github/codeql-action/upload-sarif@v2` 过时

**修复**:
```yaml
# 修复前
- uses: github/codeql-action/upload-sarif@v2

# 修复后
- uses: github/codeql-action/upload-sarif@v3
```

## 🔧 验证修复

### 1. 本地验证

```bash
# 检查工作流语法
cd .github/workflows
for file in *.yml; do
  echo "检查 $file..."
  # 使用 GitHub CLI 验证语法 (如果安装了)
  gh workflow view "$file" --repo your-username/ppt2code || echo "请在 GitHub 上验证"
done
```

### 2. GitHub 验证

1. 推送更改到 GitHub
2. 查看 Actions 页面确认没有弃用警告
3. 手动触发工作流测试

### 3. 自动检查

项目现在包含自动版本检查工作流 (`.github/workflows/check-actions.yml`)：

- 每月自动检查一次
- 发现弃用版本时自动创建 Issue
- 可手动触发检查

## 📋 完整的版本对照表

| Action | 弃用版本 | 推荐版本 | 状态 |
|--------|----------|----------|------|
| actions/checkout | v3 | v4 | ✅ 已更新 |
| actions/setup-node | v3 | v4 | ✅ 已更新 |
| actions/upload-artifact | v3 | v4 | ✅ 已修复 |
| actions/upload-release-asset | v1 | softprops/action-gh-release@v1 | ✅ 已修复 |
| github/codeql-action/upload-sarif | v2 | v3 | ✅ 已修复 |
| docker/setup-buildx-action | v2 | v3 | ✅ 已更新 |
| docker/build-push-action | v4 | v5 | ✅ 已更新 |

## 🚀 测试修复结果

### 1. 测试 CI 工作流

```bash
# 创建测试分支
git checkout -b test-actions-fix

# 推送触发 CI
git push origin test-actions-fix
```

### 2. 测试 Docker 构建

```bash
# 推送到主分支触发构建
git checkout main
git merge test-actions-fix
git push origin main
```

### 3. 测试发布流程

```bash
# 创建测试标签
git tag v1.0.1-test
git push origin v1.0.1-test

# 在 GitHub 上创建 Release 测试完整流程
```

## 🔍 监控和维护

### 1. 定期检查

- 每月运行自动检查工作流
- 关注 GitHub 的弃用通知
- 订阅相关 Actions 的更新

### 2. 更新策略

- 优先修复弃用警告
- 定期更新到最新稳定版本
- 测试后再应用到生产环境

### 3. 文档维护

- 更新此文档记录新的修复
- 在 README 中说明版本要求
- 保持 GITHUB_ACTIONS.md 的更新

## 📞 故障排除

### 常见问题

1. **权限错误**
   ```
   Error: Resource not accessible by integration
   ```
   **解决**: 检查 GITHUB_TOKEN 权限设置

2. **工作流语法错误**
   ```
   Invalid workflow file
   ```
   **解决**: 使用 YAML 验证器检查语法

3. **Action 版本不存在**
   ```
   Unable to resolve action
   ```
   **解决**: 检查 Action 的可用版本

### 调试技巧

1. **启用调试日志**
   ```yaml
   env:
     ACTIONS_STEP_DEBUG: true
     ACTIONS_RUNNER_DEBUG: true
   ```

2. **本地测试**
   ```bash
   # 使用 act 本地运行 Actions
   act -j build
   ```

3. **分步测试**
   - 先测试单个工作流
   - 逐步启用所有功能
   - 监控每个步骤的输出

通过这些修复，你的 GitHub Actions 工作流现在应该完全兼容最新版本，不会再出现弃用警告！
