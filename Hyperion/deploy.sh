#!/bin/bash
# Hyperion 一键部署脚本
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════╗"
echo "║         Hyperion 部署工具            ║"
echo "║   以光明之名，掌控网络之流           ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# 1. Check Docker
echo -e "${YELLOW}[1/4] 检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装！请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose 未安装！请升级 Docker 至最新版本${NC}"
    exit 1
fi

echo -e "${GREEN}Docker ✓${NC}"

# 2. Check config
echo -e "${YELLOW}[2/4] 检查配置...${NC}"
if [ ! -f config/config.yaml ]; then
    echo -e "${YELLOW}未找到 config/config.yaml，使用示例配置...${NC}"
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}已创建 .env 配置文件${NC}"
fi

# 3. Build & Start
echo -e "${YELLOW}[3/4] 构建并启动容器...${NC}"
docker compose up -d --build

# 4. Done
echo -e "${YELLOW}[4/4] 启动完成！${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Hyperion 已启动！${NC}"
echo ""
echo -e "  前端面板: ${BLUE}http://localhost:${PORT:-8080}${NC}"
echo -e "  代理端口: ${BLUE}127.0.0.1:${PROXY_PORT:-7890}${NC}"
echo ""
echo -e "  常用命令:"
echo -e "    查看日志: ${BLUE}docker compose logs -f${NC}"
echo -e "    停止服务: ${BLUE}docker compose down${NC}"
echo -e "    重启服务: ${BLUE}docker compose restart${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
