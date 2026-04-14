#!/bin/bash
# Hyperion 安装脚本 v2.1
# -------------------------------------------------------------------
# 一键安装 Hyperion + Hades，支持 Docker Compose 部署
# -------------------------------------------------------------------

set -e

INSTALL_DIR="/opt/hyperion"
REPO_URL="https://github.com/Qing060325/Hyperion.git"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Hyperion 一键安装脚本 v2.1      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# -------------------------------------------------------------------
# 1. 检查 Docker
# -------------------------------------------------------------------
echo -e "${BLUE}[1/6]${NC} 检查 Docker..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    echo "请升级 Docker 至最新版本"
    exit 1
fi

# 检查 docker 权限
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}⚠️  当前用户无 Docker 权限，尝试使用 sudo...${NC}"
    if ! sudo docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 服务未运行或无权限${NC}"
        echo "请执行: sudo usermod -aG docker \$USER && newgrp docker"
        exit 1
    fi
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

echo -e "${GREEN}✅ Docker 检查通过${NC}"

# -------------------------------------------------------------------
# 2. 清理旧安装
# -------------------------------------------------------------------
echo -e "${BLUE}[2/6]${NC} 检查旧安装..."

for old_dir in /opt/Hyperion /opt/hyperion-app /opt/hyperion; do
    if [ -d "$old_dir" ] && [ -f "$old_dir/docker-compose.yml" ]; then
        echo -e "${YELLOW}🧹 清理旧安装: $old_dir${NC}"
        cd "$old_dir"
        $DOCKER_CMD compose down 2>/dev/null || true
        sudo rm -rf "$old_dir"
    fi
done

echo -e "${GREEN}✅ 环境准备完成${NC}"

# -------------------------------------------------------------------
# 3. 克隆仓库
# -------------------------------------------------------------------
echo -e "${BLUE}[3/6]${NC} 下载 Hyperion..."

sudo rm -rf "$INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"

# 设置目录权限
sudo chown -R "$(whoami)" "$INSTALL_DIR"

cd "$INSTALL_DIR"
echo -e "${GREEN}✅ 下载完成${NC}"

# -------------------------------------------------------------------
# 4. 检查关键文件
# -------------------------------------------------------------------
echo -e "${BLUE}[4/6]${NC} 检查项目文件..."

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml 未找到，安装包可能损坏${NC}"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile 未找到，安装包可能损坏${NC}"
    exit 1
fi

if [ ! -f "Dockerfile.hades" ]; then
    echo -e "${RED}❌ Dockerfile.hades 未找到，安装包可能损坏${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 文件检查通过${NC}"

# -------------------------------------------------------------------
# 5. 初始化配置
# -------------------------------------------------------------------
echo -e "${BLUE}[5/6]${NC} 初始化配置..."

# 创建 .env 文件
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
PORT=8080
PROXY_PORT=7890
EOF
    echo -e "${GREEN}✅ .env 文件已创建${NC}"
fi

# 创建 Hades 配置文件
if [ ! -f "config/config.yaml" ]; then
    cp config/example-config.yaml config/config.yaml
    echo -e "${GREEN}✅ Hades 配置文件已创建${NC}"
else
    echo -e "${GREEN}✅ Hades 配置文件已存在${NC}"
fi

# 确保 external-controller 绑定 0.0.0.0（Docker 容器内必须）
if grep -q "external-controller: 127.0.0.1" config/config.yaml 2>/dev/null; then
    sed -i 's/external-controller: 127.0.0.1/external-controller: 0.0.0.0/' config/config.yaml
    echo -e "${GREEN}✅ 已修复 external-controller 绑定地址${NC}"
fi

# -------------------------------------------------------------------
# 6. 构建并启动
# -------------------------------------------------------------------
echo -e "${BLUE}[6/6]${NC} 构建 Docker 镜像并启动服务..."
echo -e "${YELLOW}   （首次构建可能需要几分钟，请耐心等待）${NC}"

$DOCKER_CMD compose up -d --build

# 检查启动状态
echo ""
sleep 3

if $DOCKER_CMD compose ps | grep -q "Up\|running"; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  🎉 Hyperion 安装成功！${NC}"
    echo ""
    echo -e "  📱 前端面板: ${BLUE}http://localhost:${PORT:-8080}${NC}"
    echo -e "  🔌 代理端口: ${BLUE}127.0.0.1:${PROXY_PORT:-7890}${NC}"
    echo ""
    echo -e "  📁 安装目录: ${BLUE}$INSTALL_DIR${NC}"
    echo -e "  ⚙️  Hades 配置: ${BLUE}$INSTALL_DIR/config/config.yaml${NC}"
    echo -e "  🔧 环境变量: ${BLUE}$INSTALL_DIR/.env${NC}"
    echo ""
    echo -e "  📋 常用命令:"
    echo -e "     查看状态: ${BLUE}cd $INSTALL_DIR && $DOCKER_CMD compose ps${NC}"
    echo -e "     查看日志: ${BLUE}cd $INSTALL_DIR && $DOCKER_CMD compose logs -f${NC}"
    echo -e "     停止服务: ${BLUE}cd $INSTALL_DIR && $DOCKER_CMD compose down${NC}"
    echo -e "     重启服务: ${BLUE}cd $INSTALL_DIR && $DOCKER_CMD compose restart${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  服务可能还在启动中，请稍等片刻后检查：${NC}"
    echo -e "   ${BLUE}cd $INSTALL_DIR && $DOCKER_CMD compose ps${NC}"
    echo -e "   ${BLUE}cd $INSTALL_DIR && $DOCKER_CMD compose logs -f${NC}"
fi
