# PPT2Code Docker配置文件
# 基于Ubuntu 24.04构建

FROM ubuntu:24.04

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 更新系统并安装基础依赖
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# 设置时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 安装Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs

# 安装LibreOffice
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-java-common \
    && rm -rf /var/lib/apt/lists/*

# 安装ImageMagick
RUN apt-get update && apt-get install -y \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# 安装中文字体支持
RUN apt-get update && apt-get install -y \
    fonts-wqy-microhei \
    fonts-wqy-zenhei \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN useradd -m -s /bin/bash ppt2code

# 复制package文件
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads converted qrcodes logs \
    && chown -R ppt2code:ppt2code /app

# 设置权限
RUN chmod +x deploy-ubuntu.sh batch-process.js

# 切换到应用用户
USER ppt2code

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 启动命令
CMD ["node", "server.js"]
