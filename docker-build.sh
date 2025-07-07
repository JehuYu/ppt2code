#!/bin/bash

# PPT2Code Docker 构建脚本

set -e

echo "🐳 PPT2Code Docker 构建工具"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
IMAGE_NAME="ppt2code"
TAG=${1:-latest}
REGISTRY=${REGISTRY:-"ghcr.io/your-username"}
DOCKERFILE=${DOCKERFILE:-"Dockerfile"}

# 显示帮助
show_help() {
    echo "用法: $0 [TAG] [COMMAND]"
    echo ""
    echo "TAG: 镜像标签 (默认: latest)"
    echo ""
    echo "命令:"
    echo "  build    - 构建镜像"
    echo "  test     - 构建并测试镜像"
    echo "  push     - 构建并推送镜像"
    echo "  run      - 运行镜像"
    echo "  clean    - 清理镜像"
    echo "  help     - 显示帮助"
    echo ""
    echo "环境变量:"
    echo "  DOCKERFILE - 指定Dockerfile (默认: Dockerfile)"
    echo "  REGISTRY   - 指定镜像仓库 (默认: ghcr.io/your-username)"
    echo ""
    echo "示例:"
    echo "  $0 v1.0.0 build"
    echo "  $0 latest test"
    echo "  DOCKERFILE=Dockerfile.simple $0 latest build"
    echo "  REGISTRY=your-registry.com $0 latest push"
}

# 检查Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker 未运行${NC}"
        exit 1
    fi
}

# 构建镜像
build_image() {
    local full_name="${IMAGE_NAME}:${TAG}"
    
    echo -e "${BLUE}📦 构建镜像: ${full_name}${NC}"
    
    docker build \
        --file "${DOCKERFILE}" \
        --tag "${full_name}" \
        --build-arg BUILDTIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VERSION="${TAG}" \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 镜像构建成功${NC}"
        
        # 显示镜像信息
        echo -e "${YELLOW}📋 镜像信息:${NC}"
        docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
        return 0
    else
        echo -e "${RED}❌ 镜像构建失败${NC}"
        return 1
    fi
}

# 测试镜像
test_image() {
    local full_name="${IMAGE_NAME}:${TAG}"
    local container_name="ppt2code-test"
    
    echo -e "${BLUE}🧪 测试镜像: ${full_name}${NC}"
    
    # 清理已存在的测试容器
    docker stop "${container_name}" 2>/dev/null || true
    docker rm "${container_name}" 2>/dev/null || true
    
    # 启动测试容器
    echo -e "${YELLOW}🚀 启动测试容器...${NC}"
    docker run -d \
        --name "${container_name}" \
        -p 3000:3000 \
        "${full_name}"
    
    # 等待服务启动
    echo -e "${YELLOW}⏳ 等待服务启动 (30秒)...${NC}"
    sleep 30
    
    # 测试健康检查
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务测试通过${NC}"
        echo -e "${GREEN}🌐 访问地址: http://localhost:3000${NC}"
        
        # 显示容器状态
        echo -e "${YELLOW}📊 容器状态:${NC}"
        docker ps --filter "name=${container_name}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo ""
        echo "测试完成！容器仍在运行，可以手动测试。"
        echo "清理命令: docker stop ${container_name} && docker rm ${container_name}"
        return 0
    else
        echo -e "${RED}❌ 服务测试失败${NC}"
        echo -e "${YELLOW}📋 容器日志:${NC}"
        docker logs "${container_name}"
        
        # 清理失败的容器
        docker stop "${container_name}" 2>/dev/null || true
        docker rm "${container_name}" 2>/dev/null || true
        return 1
    fi
}

# 推送镜像
push_image() {
    local full_name="${IMAGE_NAME}:${TAG}"
    local remote_name="${REGISTRY}/${IMAGE_NAME}:${TAG}"
    
    echo -e "${BLUE}📤 推送镜像: ${remote_name}${NC}"
    
    # 标记镜像
    docker tag "${full_name}" "${remote_name}"
    
    # 推送镜像
    docker push "${remote_name}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 镜像推送成功${NC}"
        echo -e "${GREEN}🌐 镜像地址: ${remote_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ 镜像推送失败${NC}"
        return 1
    fi
}

# 运行镜像
run_image() {
    local full_name="${IMAGE_NAME}:${TAG}"
    local container_name="ppt2code"
    
    echo -e "${BLUE}🚀 运行镜像: ${full_name}${NC}"
    
    # 停止已存在的容器
    docker stop "${container_name}" 2>/dev/null || true
    docker rm "${container_name}" 2>/dev/null || true
    
    # 运行容器
    docker run -d \
        --name "${container_name}" \
        -p 3000:3000 \
        -v "$(pwd)/data/uploads:/app/uploads" \
        -v "$(pwd)/data/converted:/app/converted" \
        -v "$(pwd)/data/qrcodes:/app/qrcodes" \
        -v "$(pwd)/data/logs:/app/logs" \
        --restart unless-stopped \
        "${full_name}"
    
    echo -e "${GREEN}✅ 容器启动成功${NC}"
    echo -e "${GREEN}🌐 访问地址: http://localhost:3000${NC}"
    echo ""
    echo "管理命令:"
    echo "  docker logs ${container_name}     # 查看日志"
    echo "  docker stop ${container_name}     # 停止容器"
    echo "  docker restart ${container_name}  # 重启容器"
}

# 清理镜像
clean_images() {
    echo -e "${BLUE}🧹 清理镜像和容器${NC}"
    
    # 停止并删除容器
    docker ps -a --filter "ancestor=${IMAGE_NAME}" --format "{{.Names}}" | xargs -r docker stop
    docker ps -a --filter "ancestor=${IMAGE_NAME}" --format "{{.Names}}" | xargs -r docker rm
    
    # 删除镜像
    docker images "${IMAGE_NAME}" --format "{{.Repository}}:{{.Tag}}" | xargs -r docker rmi
    
    # 清理构建缓存
    docker builder prune -f
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主函数
main() {
    check_docker
    
    local command=${2:-build}
    
    case $command in
        build)
            build_image
            ;;
        test)
            build_image && test_image
            ;;
        push)
            build_image && push_image
            ;;
        run)
            run_image
            ;;
        clean)
            clean_images
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
