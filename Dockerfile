# PPT2Code Docker配置文件
# 简化版本，专注于构建成功

FROM node:18-bullseye-slim

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libreoffice \
    imagemagick \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 复制package文件
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads converted qrcodes logs

# 创建非root用户
RUN useradd -m -s /bin/bash ppt2code \
    && chown -R ppt2code:ppt2code /app

# 切换到非root用户
USER ppt2code

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 启动命令
CMD ["node", "server.js"]
