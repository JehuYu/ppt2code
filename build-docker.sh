#!/bin/bash

# PPT2Code Docker 构建脚本

set -e

echo "🐳 开始构建 PPT2Code Docker 镜像..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 镜像名称和标签
IMAGE_NAME="ppt2code"
TAG=${1:-latest}
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo -e "${YELLOW}构建镜像: ${FULL_IMAGE_NAME}${NC}"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请启动 Docker${NC}"
    exit 1
fi

# 构建镜像
echo -e "${YELLOW}📦 开始构建镜像...${NC}"
docker build -t "${FULL_IMAGE_NAME}" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 镜像构建成功！${NC}"
    
    # 显示镜像信息
    echo -e "${YELLOW}📋 镜像信息:${NC}"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    # 询问是否运行测试
    echo ""
    read -p "是否运行测试容器? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚀 启动测试容器...${NC}"
        
        # 停止并删除已存在的测试容器
        docker stop ppt2code-test 2>/dev/null || true
        docker rm ppt2code-test 2>/dev/null || true
        
        # 运行测试容器
        docker run -d \
            --name ppt2code-test \
            -p 3000:3000 \
            "${FULL_IMAGE_NAME}"
        
        echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
        sleep 15
        
        # 测试健康检查
        if curl -f http://localhost:3000/ > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 服务启动成功！${NC}"
            echo -e "${GREEN}🌐 访问地址: http://localhost:3000${NC}"
            echo ""
            echo "测试完成后，运行以下命令清理:"
            echo "docker stop ppt2code-test && docker rm ppt2code-test"
        else
            echo -e "${RED}❌ 服务启动失败${NC}"
            echo "查看日志:"
            docker logs ppt2code-test
            docker stop ppt2code-test
            docker rm ppt2code-test
        fi
    fi
    
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 构建完成！${NC}"
echo ""
echo "可用命令:"
echo "  docker run -d -p 3000:3000 --name ppt2code ${FULL_IMAGE_NAME}"
echo "  docker logs ppt2code"
echo "  docker stop ppt2code"
