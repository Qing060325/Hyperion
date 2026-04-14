#!/bin/bash

# Hyperion 一键安装与管理脚本
# -------------------------------------------------------------------
# 该脚本旨在提供类似 Mihomo 的一键安装体验，支持 Docker Compose 部署和管理 Hyperion。
# 功能包括：安装、启动、停止、重启、更新和卸载。
# -------------------------------------------------------------------

set -e

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 定义变量
REPO_URL="https://github.com/Qing060325/Hyperion.git"
REPO_NAME="Hyperion"
INSTALL_PATH="/opt/hyperion-app"

# -------------------------------------------------------------------
# 辅助函数
# -------------------------------------------------------------------

# 打印信息
print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# 打印成功信息
print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# 打印警告信息
print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# 打印错误信息并退出
print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# 检查 Docker 和 Docker Compose 是否安装
check_docker() {
    print_info "检查 Docker 和 Docker Compose..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装！请手动安装 Docker 后重试。参考: https://docs.docker.com/get-docker/"
    fi
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装！请升级 Docker 至最新版本或手动安装 Docker Compose。"
    fi
    print_success "Docker 和 Docker Compose 已安装。"
}

# 检查 Hyperion 是否已安装
is_installed() {
    [ -f "$INSTALL_PATH/docker-compose.yml" ]
}

# -------------------------------------------------------------------
# 主要功能
# -------------------------------------------------------------------

# 安装 Hyperion
install_hyperion() {
    check_docker

    if is_installed; then
        print_warning "Hyperion 似乎已安装在 $INSTALL_PATH。请选择 '更新' 或 '卸载' 后再尝试安装。"
        return
    fi

    print_info "克隆 Hyperion 仓库到 $INSTALL_PATH..."
    sudo mkdir -p "$INSTALL_PATH"
    sudo git clone "$REPO_URL" "$INSTALL_PATH"
    print_success "仓库克隆完成。"

    # 进入项目目录
    cd "$INSTALL_PATH"

    print_info "初始化配置文件..."
    if [ ! -f "config/config.yaml" ]; then
        sudo cp "config/example-config.yaml" "config/config.yaml"
        print_success "已创建 config/config.yaml。请根据需要编辑。"
    fi
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            sudo cp ".env.example" ".env"
            print_success "已创建 .env 文件。请根据需要编辑。"
        else
            print_warning "未找到 .env.example，跳过 .env 初始化。"
        fi
    fi

    print_info "启动 Hyperion 服务..."
    sudo docker compose up -d --build
    print_success "Hyperion 已成功安装并启动！"
    display_access_info
}

# 启动 Hyperion
start_hyperion() {
    if ! is_installed; then
        print_error "Hyperion 未安装。请先运行安装命令。"
    fi
    print_info "启动 Hyperion 服务..."
    cd "$INSTALL_PATH"
    sudo docker compose up -d
    print_success "Hyperion 服务已启动！"
    display_access_info
}

# 停止 Hyperion
stop_hyperion() {
    if ! is_installed; then
        print_error "Hyperion 未安装。"
    fi
    print_info "停止 Hyperion 服务..."
    cd "$INSTALL_PATH"
    sudo docker compose down
    print_success "Hyperion 服务已停止。"
}

# 重启 Hyperion
restart_hyperion() {
    if ! is_installed; then
        print_error "Hyperion 未安装。"
    fi
    print_info "重启 Hyperion 服务..."
    cd "$INSTALL_PATH"
    sudo docker compose restart
    print_success "Hyperion 服务已重启！"
    display_access_info
}

# 更新 Hyperion
update_hyperion() {
    if ! is_installed; then
        print_error "Hyperion 未安装。请先运行安装命令。"
    fi
    print_info "更新 Hyperion 仓库和重建 Docker 镜像..."
    cd "$INSTALL_PATH"
    sudo git pull origin main
    sudo docker compose pull
    sudo docker compose up -d --build
    print_success "Hyperion 已更新并重启！"
    display_access_info
}

# 卸载 Hyperion
uninstall_hyperion() {
    if ! is_installed; then
        print_error "Hyperion 未安装。"
    fi
    print_warning "这将停止并移除所有 Hyperion 相关的 Docker 容器、镜像和数据。"
    echo -n "确定要卸载 Hyperion 吗？ (y/N): "
    if [ -t 0 ]; then
        read -r confirm
    else
        read -r confirm </dev/tty
    fi
    if [[ "$confirm" =~ ^[yY]$ ]]; then
        print_info "停止并移除 Docker 容器和镜像..."
        cd "$INSTALL_PATH"
        sudo docker compose down -v --rmi all
        print_info "删除安装目录..."
        sudo rm -rf "$INSTALL_PATH"
        print_success "Hyperion 已成功卸载。"
    else
        print_info "卸载已取消。"
    fi
}

# 显示访问信息
display_access_info() {
    print_info "获取 Hyperion 访问信息..."
    local port="8080"
    local proxy_port="7890"

    if [ -f "$INSTALL_PATH/.env" ]; then
        port=$(grep -E "^PORT=" "$INSTALL_PATH/.env" | cut -d '=' -f 2 || echo "8080")
        proxy_port=$(grep -E "^PROXY_PORT=" "$INSTALL_PATH/.env" | cut -d '=' -f 2 || echo "7890")
    fi

    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Hyperion 服务信息${NC}"
    echo -e "\n  前端面板: ${BLUE}http://localhost:${port}${NC}"
    echo -e "  代理端口: ${BLUE}127.0.0.1:${proxy_port}${NC}"
    echo -e "\n  配置文件位置: ${BLUE}$INSTALL_PATH/config/config.yaml${NC}"
    echo -e "  环境变量文件: ${BLUE}$INSTALL_PATH/.env${NC}"
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# -------------------------------------------------------------------
# 主菜单
# -------------------------------------------------------------------

show_menu() {
    echo -e "\n${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Hyperion 管理工具            ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}请选择操作:${NC}"
    echo -e "  ${GREEN}1)${NC} 安装 Hyperion (首次运行)"
    echo -e "  ${GREEN}2)${NC} 启动 Hyperion"
    echo -e "  ${GREEN}3)${NC} 停止 Hyperion"
    echo -e "  ${GREEN}4)${NC} 重启 Hyperion"
    echo -e "  ${GREEN}5)${NC} 更新 Hyperion"
    echo -e "  ${GREEN}6)${NC} 卸载 Hyperion"
    echo -e "  ${GREEN}7)${NC} 查看访问信息"
    echo -e "  ${GREEN}0)${NC} 退出"
    echo -n "请输入选项 [0-7]: "
}

main() {
    while true; do
        show_menu
        if [ -t 0 ]; then
            read -r choice
        else
            read -r choice </dev/tty
        fi
        case "$choice" in
            1) install_hyperion ;;
            2) start_hyperion ;;
            3) stop_hyperion ;;
            4) restart_hyperion ;;
            5) update_hyperion ;;
            6) uninstall_hyperion ;;
            7) display_access_info ;;
            0) print_info "退出脚本。"; exit 0 ;;
            *) print_warning "无效选项，请重新输入。" ;;
        esac
        echo # Add a newline for better readability
    done
}

main
