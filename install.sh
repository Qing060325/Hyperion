#!/bin/bash
# Hyperion 安装脚本 v2.0 - 简化版

set -e

INSTALL_DIR="/opt/hyperion"
REPO_URL="https://github.com/Qing060325/Hyperion.git"

echo "=== Hyperion 安装脚本 ==="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

echo "✅ Docker 检查通过"

# 清理旧安装（如果有）
if [ -d "$INSTALL_DIR" ]; then
    echo "🧹 发现旧安装，正在清理..."
    sudo docker compose -f "$INSTALL_DIR/docker-compose.yml" down 2>/dev/null || true
    sudo rm -rf "$INSTALL_DIR"
fi

# 克隆仓库
echo "📦 正在下载 Hyperion..."
sudo mkdir -p "$INSTALL_DIR"
sudo git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"

# 进入目录
cd "$INSTALL_DIR"

# 检查关键文件
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：docker-compose.yml 未找到"
    exit 1
fi

echo "✅ 文件检查通过"

# 初始化配置
if [ -f "config/example-config.yaml" ] && [ ! -f "config/config.yaml" ]; then
    sudo cp config/example-config.yaml config/config.yaml
    echo "✅ 配置文件已创建"
fi

# 启动服务
echo "🚀 正在启动 Hyperion..."
sudo docker compose up -d --build

# 显示信息
echo ""
echo "=========================================="
echo "🎉 Hyperion 安装成功！"
echo ""
echo "📱 访问地址: http://localhost:8080"
echo "📁 安装目录: $INSTALL_DIR"
echo "⚙️  配置文件: $INSTALL_DIR/config/config.yaml"
echo "=========================================="
