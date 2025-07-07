#!/bin/bash

# PPT2Code Ubuntu 24 部署脚本
# 自动安装所有依赖并配置环境

set -e

echo "🚀 开始在Ubuntu 24上部署PPT2Code..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，建议使用普通用户运行此脚本"
        read -p "是否继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    sudo apt update && sudo apt upgrade -y
    log_success "系统更新完成"
}

# 安装Node.js
install_nodejs() {
    log_info "安装Node.js..."
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求 (>= 16)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            log_success "Node.js版本满足要求"
            return
        else
            log_warning "Node.js版本过低，需要升级"
        fi
    fi
    
    # 安装Node.js 18 LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # 验证安装
    node --version
    npm --version
    log_success "Node.js安装完成"
}

# 安装LibreOffice
install_libreoffice() {
    log_info "安装LibreOffice..."
    
    if command -v soffice &> /dev/null; then
        log_info "LibreOffice已安装"
        soffice --version
        return
    fi
    
    sudo apt-get install -y libreoffice
    
    # 验证安装
    soffice --version
    log_success "LibreOffice安装完成"
}

# 安装ImageMagick
install_imagemagick() {
    log_info "安装ImageMagick..."
    
    if command -v magick &> /dev/null; then
        log_info "ImageMagick已安装"
        magick --version | head -1
        return
    fi
    
    sudo apt-get install -y imagemagick
    
    # 验证安装
    magick --version | head -1
    log_success "ImageMagick安装完成"
}

# 安装PM2
install_pm2() {
    log_info "安装PM2进程管理器..."
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2已安装"
        return
    fi
    
    sudo npm install -g pm2
    
    # 设置开机自启
    sudo pm2 startup
    log_success "PM2安装完成"
}

# 安装Nginx (可选)
install_nginx() {
    read -p "是否安装Nginx作为反向代理? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "安装Nginx..."
        sudo apt-get install -y nginx
        
        # 启动并启用Nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        log_success "Nginx安装完成"
        log_info "Nginx配置文件位置: /etc/nginx/sites-available/"
    fi
}

# 创建项目目录和用户
setup_project() {
    log_info "设置项目环境..."
    
    # 创建项目用户 (如果不存在)
    if ! id "ppt2code" &>/dev/null; then
        sudo useradd -m -s /bin/bash ppt2code
        log_info "创建用户: ppt2code"
    fi
    
    # 设置项目目录
    PROJECT_DIR="/opt/ppt2code"
    sudo mkdir -p $PROJECT_DIR
    sudo chown ppt2code:ppt2code $PROJECT_DIR
    
    log_success "项目环境设置完成"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 确保在项目目录中
    if [ ! -f "package.json" ]; then
        log_error "未找到package.json文件，请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 安装依赖
    npm install
    
    # 创建必要的目录
    mkdir -p uploads converted qrcodes logs
    
    # 设置权限
    chmod 755 uploads converted qrcodes logs
    
    log_success "项目依赖安装完成"
}

# 创建systemd服务
create_systemd_service() {
    log_info "创建systemd服务..."
    
    PROJECT_DIR=$(pwd)
    
    sudo tee /etc/systemd/system/ppt2code.service > /dev/null <<EOF
[Unit]
Description=PPT2Code Service
After=network.target

[Service]
Type=simple
User=ppt2code
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

# 日志
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ppt2code

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载systemd
    sudo systemctl daemon-reload
    sudo systemctl enable ppt2code
    
    log_success "systemd服务创建完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    # 检查ufw是否安装
    if command -v ufw &> /dev/null; then
        sudo ufw allow 3000/tcp
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # 启用防火墙 (如果未启用)
        sudo ufw --force enable
        
        log_success "防火墙配置完成"
    else
        log_warning "ufw未安装，跳过防火墙配置"
    fi
}

# 创建Nginx配置
create_nginx_config() {
    if command -v nginx &> /dev/null; then
        log_info "创建Nginx配置..."
        
        read -p "请输入域名 (或IP地址): " DOMAIN
        
        sudo tee /etc/nginx/sites-available/ppt2code > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 文件上传大小限制
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

        # 启用站点
        sudo ln -sf /etc/nginx/sites-available/ppt2code /etc/nginx/sites-enabled/
        
        # 测试配置
        sudo nginx -t
        
        # 重启Nginx
        sudo systemctl restart nginx
        
        log_success "Nginx配置完成"
        log_info "网站地址: http://$DOMAIN"
    fi
}

# 主安装流程
main() {
    log_info "PPT2Code Ubuntu 24 自动部署脚本"
    echo "=================================="
    
    check_root
    update_system
    install_nodejs
    install_libreoffice
    install_imagemagick
    install_pm2
    install_nginx
    setup_project
    install_dependencies
    create_systemd_service
    setup_firewall
    create_nginx_config
    
    echo
    log_success "🎉 部署完成！"
    echo "=================================="
    log_info "启动服务: sudo systemctl start ppt2code"
    log_info "查看状态: sudo systemctl status ppt2code"
    log_info "查看日志: sudo journalctl -u ppt2code -f"
    log_info "使用PM2: pm2 start server.js --name ppt2code"
    echo
    log_info "项目目录: $(pwd)"
    log_info "访问地址: http://localhost:3000"
    echo
}

# 运行主程序
main "$@"
