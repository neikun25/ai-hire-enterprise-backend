# 使用 Node.js 20 轻量级镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 全局安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件并安装
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# 复制项目所有文件
COPY . .

# 暴露后端运行的端口 (你在代码中默认是 3000)
EXPOSE 3000

# 启动命令 (请确保你的 package.json 中有 "start" 脚本，例如 "tsx server/index.ts" 或先 build 再 node)
CMD ["pnpm", "start"]