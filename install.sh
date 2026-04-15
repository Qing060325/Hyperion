#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║          Hyperion 一键安装脚本 v3.0                          ║
# ║   以光明之名，掌控网络之流                                    ║
# ║                                                              ║
# ║   用法:                                                      ║
# ║     非交互安装:  curl -fsSL <url> | sudo bash               ║
# ║     交互管理:    sudo bash install.sh                        ║
# ║     指定操作:    sudo bash install.sh [install|start|stop   ║
# ║                   |restart|update|uninstall|status|logs]    ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

# ────────────────────── 配置 ──────────────────────

readonly SCRIPT_VER="3.0"
readonly REPO_URL="https://github.com/Qing060325/Hyperion.git"
readonly INSTALL_DIR="/opt/hyperion"
readonly CONFIG_DIR="${INSTALL_DIR}/config"
readonly ENV_FILE="${INSTALL_DIR}/.env"
readonly COMPOSE_FILE="${INSTALL_DIR}/docker-compose.yml"
readonly BACKUP_DIR="/opt/hyperion-backup"

# ────────────────────── 颜色 ──────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ────────────────────── 工具函数 ──────────────────────

info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
step()  { echo -e "\n${CYAN}━━━${NC} ${BOLD}$1${NC}"; }
die()   { err "$1"; exit 1; }

separator() {
  echo -e "${BLUE}┌──────────────────────────────────────┐${NC}"
  echo -e "${BLUE}│${NC} $1"
  echo -e "${BLUE}└──────────────────────────────────────┘${NC}"
}

read_input() {
  local prompt="$1"; local default="${2:-}"
  if [ -t 0 ]; then
    read -r -p "$prompt" val
  else
    read -r val </dev/tty
  fi
  echo "${val:-$default}"
}

confirm() {
  local prompt="$1"; local default="${2:-N}"
  local val
  val=$(read_input "$prompt [$default] " "$default")
  [[ "$val" =~ ^[yY] ]]
}

# ────────────────────── Banner ──────────────────────

show_banner() {
  echo -e "${BOLD}${CYAN}"
  echo '  ╦╔═╔═╗╔═╗╦═╗╔═╗═╗ ╦'
  echo '  ╠╩╗║ ║║ ║╠╦╝╚═╗╔╩╦╝'
  echo '  ╩ ╩╚═╝╚═╝╩╚═╚═╝╩ ╚ '
  echo -e "${NC}"
  echo -e "  ${BOLD}Hyperion${NC} 安装脚本 v${SCRIPT_VER}"
  echo -e "  ${DIM}以光明之名，掌控网络之流${NC}"
  echo ""
}

# ────────────────────── Docker 检测 ──────────────────────

DOCKER_CMD=""

check_docker() {
  step "检查 Docker 环境"

  if command -v docker &>/dev/null; then
    if docker info &>/dev/null 2>&1; then
      DOCKER_CMD="docker"
    elif sudo docker info &>/dev/null 2>&1; then
      DOCKER_CMD="sudo docker"
      warn "当前用户无 Docker 权限，将使用 sudo"
      warn "建议执行: sudo usermod -aG docker \$USER && newgrp docker"
    else
      die "Docker 服务未运行，请先启动: sudo systemctl start docker"
    fi
  else
    # 尝试自动安装 Docker
    if confirm "Docker 未安装，是否自动安装？ [y/N] " "N"; then
      install_docker
    else
      die "请先安装 Docker: https://docs.docker.com/get-docker/"
    fi
  fi

  if ! $DOCKER_CMD compose version &>/dev/null; then
    die "Docker Compose 不可用，请升级 Docker 至最新版本"
  fi

  ok "Docker $(docker --version 2>/dev/null | grep -oP 'Docker version \K[^,]+')"
  ok "Compose $($DOCKER_CMD compose version --short 2>/dev/null)"
}

install_docker() {
  step "自动安装 Docker"
  info "使用官方安装脚本..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo systemctl enable --now docker
  ok "Docker 安装完成"
}

# ────────────────────── 环境检测 ──────────────────────

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64)  echo "amd64" ;;
    aarch64|arm64) echo "arm64" ;;
    armv7l|armhf)  echo "armv7" ;;
    *)             echo "unknown" ;;
  esac
}

# ────────────────────── 判断是否已安装 ──────────────────────

is_installed() {
  [ -f "$COMPOSE_FILE" ]
}

is_running() {
  if is_installed; then
    cd "$INSTALL_DIR"
    $DOCKER_CMD compose ps --status running 2>/dev/null | grep -q "hyperion\|hades"
  fi
}

# ────────────────────── 初始化配置 ──────────────────────

init_config() {
  step "初始化配置文件"

  # .env
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "${INSTALL_DIR}/.env.example" ]; then
      cp "${INSTALL_DIR}/.env.example" "$ENV_FILE"
    else
      cat > "$ENV_FILE" << 'ENVEOF'
# Hyperion 环境配置
PORT=8080
API_PORT=9090
PROXY_PORT=7890
SECRET=
ENVEOF
    fi
    ok ".env 已创建"
  else
    ok ".env 已存在"
  fi

  # Hades 配置
  mkdir -p "$CONFIG_DIR"
  if [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
    if [ -f "${INSTALL_DIR}/config/example-config.yaml" ]; then
      cp "${INSTALL_DIR}/config/example-config.yaml" "${CONFIG_DIR}/config.yaml"
    else
      # 生成最小配置
      cat > "${CONFIG_DIR}/config.yaml" << 'CFGEOF'
# Hades 配置文件
mixed-port: 7890
external-controller: 0.0.0.0:9090
mode: rule
log-level: info
dns:
  enable: true
  listen: 0.0.0.0:1053
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
proxies: []
proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - DIRECT
rules:
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
CFGEOF
    fi
    ok "config.yaml 已创建"
  else
    ok "config.yaml 已存在"
  fi

  # 确保 external-controller 绑定 0.0.0.0（Docker 容器内必须）
  if grep -q "external-controller: 127.0.0.1" "${CONFIG_DIR}/config.yaml" 2>/dev/null; then
    sed -i 's/external-controller: 127.0.0.1/external-controller: 0.0.0.0/' "${CONFIG_DIR}/config.yaml"
    ok "已修复 external-controller 绑定地址 → 0.0.0.0"
  fi
}

# ────────────────────── 安装 ──────────────────────

do_install() {
  show_banner
  check_docker

  # 清理旧安装
  step "检查旧版本"
  for old in /opt/Hyperion /opt/hyperion-app; do
    if [ -d "$old" ] && [ -f "${old}/docker-compose.yml" ]; then
      warn "发现旧安装: $old"
      if confirm "是否清理并迁移？ [y/N] " "N"; then
        cd "$old"
        docker compose down 2>/dev/null || true
        # 迁移配置
        if [ -f "${old}/.env" ] && [ ! -f "$ENV_FILE" ]; then
          mkdir -p "$INSTALL_DIR"
          cp "${old}/.env" "${INSTALL_DIR}/.env"
          info "已迁移 .env"
        fi
        if [ -f "${old}/config/config.yaml" ] && [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
          mkdir -p "$CONFIG_DIR"
          cp "${old}/config/config.yaml" "${CONFIG_DIR}/config.yaml"
          info "已迁移 config.yaml"
        fi
        sudo rm -rf "$old"
        ok "旧安装已清理"
      fi
    fi
  done

  # 克隆
  step "下载 Hyperion"
  if [ -d "$INSTALL_DIR" ] && [ -d "${INSTALL_DIR}/.git" ]; then
    warn "安装目录已存在: $INSTALL_DIR"
    cd "$INSTALL_DIR"
    git fetch --all 2>/dev/null || true
    git reset --hard origin/main 2>/dev/null || true
    ok "已更新到最新代码"
  else
    sudo rm -rf "$INSTALL_DIR"
    sudo mkdir -p "$INSTALL_DIR"
    sudo git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
    sudo chown -R "$(whoami):$(id -gn)" "$INSTALL_DIR"
    ok "代码克隆完成"
  fi

  cd "$INSTALL_DIR"

  # 校验关键文件
  step "校验项目文件"
  for f in docker-compose.yml Dockerfile Dockerfile.hades nginx.conf; do
    [ -f "$f" ] || die "关键文件缺失: $f — 仓库可能损坏"
  done
  ok "项目文件完整"

  # 初始化配置
  init_config

  # 构建并启动
  step "构建 Docker 镜像并启动服务"
  info "首次构建可能需要 3-5 分钟，请耐心等待..."
  echo ""

  $DOCKER_CMD compose up -d --build 2>&1 | tail -5

  # 等待健康检查
  step "等待服务就绪"
  local retries=0
  local max=30
  while [ $retries -lt $max ]; do
    if $DOCKER_CMD compose ps --status running 2>/dev/null | grep -q "hyperion"; then
      break
    fi
    retries=$((retries + 1))
    printf "\r  等待中... %d/%d " "$retries" "$max"
    sleep 2
  done
  echo ""

  # 显示结果
  echo ""
  if is_running; then
    show_success
  else
    show_partial
  fi
}

# ────────────────────── 管理操作 ──────────────────────

do_start() {
  is_installed || die "Hyperion 未安装"
  step "启动服务"
  cd "$INSTALL_DIR"
  $DOCKER_CMD compose up -d
  ok "服务已启动"
  show_status
}

do_stop() {
  is_installed || die "Hyperion 未安装"
  step "停止服务"
  cd "$INSTALL_DIR"
  $DOCKER_CMD compose down
  ok "服务已停止"
}

do_restart() {
  is_installed || die "Hyperion 未安装"
  step "重启服务"
  cd "$INSTALL_DIR"
  $DOCKER_CMD compose restart
  ok "服务已重启"
  show_status
}

do_update() {
  is_installed || die "Hyperion 未安装"
  step "更新 Hyperion"

  # 备份配置
  warn "备份当前配置..."
  sudo rm -rf "$BACKUP_DIR"
  sudo mkdir -p "$BACKUP_DIR"
  [ -f "$ENV_FILE" ] && cp "$ENV_FILE" "$BACKUP_DIR/.env"
  [ -f "${CONFIG_DIR}/config.yaml" ] && cp "${CONFIG_DIR}/config.yaml" "$BACKUP_DIR/config.yaml"
  ok "配置已备份至 $BACKUP_DIR"

  cd "$INSTALL_DIR"

  # 拉取最新代码
  info "拉取最新代码..."
  git fetch --all 2>/dev/null || true
  git reset --hard origin/main 2>/dev/null || true

  # 恢复配置
  [ -f "$BACKUP_DIR/.env" ] && cp "$BACKUP_DIR/.env" "$ENV_FILE"
  [ -f "$BACKUP_DIR/config.yaml" ] && cp "$BACKUP_DIR/config.yaml" "${CONFIG_DIR}/config.yaml"

  # 重建并启动
  info "重建并启动..."
  $DOCKER_CMD compose up -d --build 2>&1 | tail -5

  # 清理旧镜像
  $DOCKER_CMD image prune -f &>/dev/null || true

  ok "更新完成"
  sudo rm -rf "$BACKUP_DIR"
  show_status
}

do_uninstall() {
  is_installed || die "Hyperion 未安装"

  echo -e "\n${RED}⚠️  即将卸载 Hyperion 及所有数据${NC}"
  if ! confirm "确定要卸载吗？此操作不可恢复 [y/N] " "N"; then
    info "已取消"; return
  fi

  step "卸载 Hyperion"
  cd "$INSTALL_DIR"
  $DOCKER_CMD compose down -v --rmi all 2>/dev/null || true
  cd /
  sudo rm -rf "$INSTALL_DIR" "$BACKUP_DIR"
  $DOCKER_CMD image prune -f &>/dev/null || true
  ok "Hyperion 已完全卸载"
}

do_logs() {
  is_installed || die "Hyperion 未安装"
  cd "$INSTALL_DIR"
  $DOCKER_CMD compose logs -f --tail 100
}

# ────────────────────── 状态展示 ──────────────────────

show_status() {
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if ! is_installed; then
    echo -e "  状态: ${RED}未安装${NC}"
  elif is_running; then
    echo -e "  状态: ${GREEN}● 运行中${NC}"
  else
    echo -e "  状态: ${YELLOW}○ 已停止${NC}"
  fi

  if is_installed; then
    local port proxy_port api_port
    port=$(grep -E "^PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "8080")
    proxy_port=$(grep -E "^PROXY_PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "7890")
    api_port=$(grep -E "^API_PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "9090")

    echo ""
    echo -e "  📱 面板地址:  ${CYAN}http://localhost:${port}${NC}"
    echo -e "  🔌 代理端口:  ${CYAN}127.0.0.1:${proxy_port}${NC}"
    echo -e "  🔗 API 端口:  ${CYAN}127.0.0.1:${api_port}${NC}"
    echo ""
    echo -e "  📁 安装目录:  ${INSTALL_DIR}"
    echo -e "  ⚙️  Hades 配置: ${CONFIG_DIR}/config.yaml"
    echo -e "  🔧 环境变量:  ${ENV_FILE}"
  fi

  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_success() {
  local port
  port=$(grep -E "^PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "8080")
  local proxy_port
  proxy_port=$(grep -E "^PROXY_PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "7890")

  echo -e "\n${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}${BOLD}  🎉 Hyperion 安装成功！${NC}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  📱 打开面板:  ${CYAN}http://localhost:${port}${NC}"
  echo -e "  🔌 代理端口:  ${CYAN}127.0.0.1:${proxy_port}${NC}"
  echo ""
  echo -e "  📋 常用命令:"
  echo -e "     查看状态:  ${CYAN}bash install.sh status${NC}"
  echo -e "     查看日志:  ${CYAN}bash install.sh logs${NC}"
  echo -e "     停止服务:  ${CYAN}bash install.sh stop${NC}"
  echo -e "     重启服务:  ${CYAN}bash install.sh restart${NC}"
  echo -e "     更新版本:  ${CYAN}bash install.sh update${NC}"
  echo -e "     卸载:      ${CYAN}bash install.sh uninstall${NC}"
  echo ""
  echo -e "  ${DIM}配置文件: ${CONFIG_DIR}/config.yaml${NC}"
  echo -e "  ${DIM}环境变量: ${ENV_FILE}${NC}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_partial() {
  echo ""
  warn "服务可能还在启动中，请稍后检查："
  echo -e "  ${CYAN}bash install.sh status${NC}"
  echo -e "  ${CYAN}bash install.sh logs${NC}"
}

# ────────────────────── 交互菜单 ──────────────────────

show_menu() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}      ${BOLD}Hyperion 管理工具 v${SCRIPT_VER}${NC}         ${CYAN}║${NC}"
  echo -e "${CYAN}╠══════════════════════════════════════╣${NC}"

  local status_icon
  if is_running 2>/dev/null; then
    status_icon="${GREEN}● 运行中${NC}"
  elif is_installed 2>/dev/null; then
    status_icon="${YELLOW}○ 已停止${NC}"
  else
    status_icon="${RED}✖ 未安装${NC}"
  fi

  echo -e "${CYAN}║${NC}  状态: ${status_icon}                    ${CYAN}║${NC}"
  echo -e "${CYAN}╠══════════════════════════════════════╣${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}1${NC}) 安装 Hyperion                     ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}2${NC}) 启动服务                           ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}3${NC}) 停止服务                           ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}4${NC}) 重启服务                           ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}5${NC}) 更新版本                           ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}6${NC}) 查看日志                           ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}7${NC}) 查看状态                           ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${RED}8${NC}) 卸载                               ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${DIM}0${NC}) 退出                               ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
  echo -n "请选择 [0-8]: "
}

interactive() {
  show_banner
  while true; do
    show_menu
    local choice
    if [ -t 0 ]; then read -r choice; else read -r choice </dev/tty; fi
    case "$choice" in
      1) do_install ;;
      2) do_start ;;
      3) do_stop ;;
      4) do_restart ;;
      5) do_update ;;
      6) do_logs ;;
      7) show_status ;;
      8) do_uninstall ;;
      0) info "再见！"; exit 0 ;;
      *) warn "无效选项" ;;
    esac
  done
}

# ────────────────────── 入口 ──────────────────────

main() {
  # 解析命令行参数
  case "${1:-}" in
    install)    do_install ;;
    start)      do_start ;;
    stop)       do_stop ;;
    restart)    do_restart ;;
    update)     do_update ;;
    uninstall)  do_uninstall ;;
    status)     show_status ;;
    logs)       do_logs ;;
    version|-v) echo "Hyperion install script v${SCRIPT_VER}" ;;
    help|-h)
      echo "用法: $0 [命令]"
      echo ""
      echo "命令:"
      echo "  install    安装 Hyperion"
      echo "  start      启动服务"
      echo "  stop       停止服务"
      echo "  restart    重启服务"
      echo "  update     更新到最新版本"
      echo "  uninstall  卸载 Hyperion"
      echo "  status     查看运行状态"
      echo "  logs       查看实时日志"
      echo "  version    显示脚本版本"
      echo ""
      echo "不带参数运行将进入交互菜单"
      ;;
    *)
      # 无参数 → 如果从管道执行则直接安装，否则进菜单
      if [ -t 0 ]; then
        interactive
      else
        do_install
      fi
      ;;
  esac
}

main "$@"
