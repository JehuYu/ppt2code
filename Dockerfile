# PPT2Code Docker配置文件
# 多阶段构建优化版本

# 构建阶段
FROM ubuntu:24.04 AS builder

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安装Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖（包括开发依赖用于构建）
RUN npm ci && npm cache clean --force

# 运行阶段
FROM ubuntu:24.04 AS runtime

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18
ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

# 设置时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libreoffice \
    libreoffice-java-common \
    imagemagick \
    fonts-wqy-microhei \
    fonts-wqy-zenhei \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 安装Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN useradd -m -s /bin/bash ppt2code

# 设置工作目录
WORKDIR /app

# 从构建阶段复制node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=ppt2code:ppt2code . .

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 创建必要的目录并设置权限
RUN mkdir -p uploads converted qrcodes logs \
    && chown -R ppt2code:ppt2code /app \
    && chmod +x deploy-ubuntu.sh batch-process.js test-system.js

# 切换到应用用户
USER ppt2code

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 启动命令
CMD ["node", "server.js"]
