#!/bin/bash

# PPT2Code Docker 快速测试脚本

set -e

echo "🧪 PPT2Code Docker 快速测试"
echo "============================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 测试不同的构建方式
test_builds() {
    echo -e "${YELLOW}📦 测试不同的构建方式...${NC}"
    
    # 测试1: 简化版 Dockerfile
    echo -e "${YELLOW}1. 测试简化版 Dockerfile (Alpine)...${NC}"
    if DOCKERFILE=Dockerfile.simple ./docker-build.sh test-simple build; then
        echo -e "${GREEN}✅ 简化版构建成功${NC}"
        SIMPLE_SUCCESS=true
    else
        echo -e "${RED}❌ 简化版构建失败${NC}"
        SIMPLE_SUCCESS=false
    fi
    
    echo ""
    
    # 测试2: 标准版 Dockerfile
    echo -e "${YELLOW}2. 测试标准版 Dockerfile (Debian)...${NC}"
    if ./docker-build.sh test-standard build; then
        echo -e "${GREEN}✅ 标准版构建成功${NC}"
        STANDARD_SUCCESS=true
    else
        echo -e "${RED}❌ 标准版构建失败${NC}"
        STANDARD_SUCCESS=false
    fi
    
    echo ""
    echo -e "${YELLOW}📊 构建结果总结:${NC}"
    echo "简化版 (Alpine): $([ "$SIMPLE_SUCCESS" = true ] && echo "✅ 成功" || echo "❌ 失败")"
    echo "标准版 (Debian): $([ "$STANDARD_SUCCESS" = true ] && echo "✅ 成功" || echo "❌ 失败")"
    
    # 推荐使用成功的版本
    if [ "$SIMPLE_SUCCESS" = true ]; then
        echo ""
        echo -e "${GREEN}💡 推荐使用简化版 (更快、更小):${NC}"
        echo "DOCKERFILE=Dockerfile.simple ./docker-build.sh latest build"
    elif [ "$STANDARD_SUCCESS" = true ]; then
        echo ""
        echo -e "${GREEN}💡 推荐使用标准版:${NC}"
        echo "./docker-build.sh latest build"
    else
        echo ""
        echo -e "${RED}⚠️  所有构建都失败了，请检查依赖和网络${NC}"
    fi
}

# 快速功能测试
quick_test() {
    local dockerfile=${1:-"Dockerfile"}
    local tag="quick-test"
    
    echo -e "${YELLOW}🚀 快速功能测试...${NC}"
    
    # 构建镜像
    if DOCKERFILE="$dockerfile" ./docker-build.sh "$tag" build; then
        echo -e "${GREEN}✅ 镜像构建成功${NC}"
    else
        echo -e "${RED}❌ 镜像构建失败${NC}"
        return 1
    fi
    
    # 启动容器
    echo -e "${YELLOW}🔄 启动测试容器...${NC}"
    docker run -d --name ppt2code-quick-test -p 3001:3000 "ppt2code:$tag"
    
    # 等待启动
    echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
    sleep 20
    
    # 测试健康检查
    if curl -f http://localhost:3001/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务启动成功${NC}"
        echo -e "${GREEN}🌐 测试地址: http://localhost:3001${NC}"
        
        # 清理
        docker stop ppt2code-quick-test
        docker rm ppt2code-quick-test
        docker rmi "ppt2code:$tag"
        
        return 0
    else
        echo -e "${RED}❌ 服务启动失败${NC}"
        echo -e "${YELLOW}📋 容器日志:${NC}"
        docker logs ppt2code-quick-test
        
        # 清理
        docker stop ppt2code-quick-test
        docker rm ppt2code-quick-test
        docker rmi "ppt2code:$tag"
        
        return 1
    fi
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
    
    echo -e "${GREEN}✅ Docker 环境正常${NC}"
}

# 主函数
main() {
    check_docker
    
    case ${1:-"all"} in
        "builds")
            test_builds
            ;;
        "quick")
            quick_test "${2:-Dockerfile}"
            ;;
        "simple")
            quick_test "Dockerfile.simple"
            ;;
        "all")
            test_builds
            echo ""
            echo -e "${YELLOW}🧪 运行快速功能测试...${NC}"
            if [ "$SIMPLE_SUCCESS" = true ]; then
                quick_test "Dockerfile.simple"
            elif [ "$STANDARD_SUCCESS" = true ]; then
                quick_test "Dockerfile"
            fi
            ;;
        "help"|"--help"|"-h")
            echo "用法: $0 [COMMAND] [OPTIONS]"
            echo ""
            echo "命令:"
            echo "  builds  - 测试所有构建方式"
            echo "  quick   - 快速功能测试"
            echo "  simple  - 测试简化版"
            echo "  all     - 运行所有测试 (默认)"
            echo "  help    - 显示帮助"
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            echo "运行 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
