#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Hyperion Termux 一键部署脚本
# 适用于 Android 手机 Termux 环境
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ARCH=$(uname -m)
case "$ARCH" in
  aarch64|arm64) ARCH_SUFFIX="arm64";;
  armv7l|arm) ARCH_SUFFIX="armv7";;
  x86_64|amd64) ARCH_SUFFIX="amd64";;
  *) echo -e "${RED}不支持的架构: $ARCH${NC}"; exit 1;;
esac

MIHOMO_VERSION="v1.19.0"
MIHOMO_FILE="mihomo-linux-${ARCH_SUFFIX}-${MIHOMO_VERSION}.gz"
MIHOMO_URL="https://github.com/MetaCubeX/mihomo/releases/download/${MIHOMO_VERSION}/${MIHOMO_FILE}"
HYPERION_PORT=8080
CLASH_PORT=9090

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║      Hyperion Termux 部署工具           ║"
echo "║    Clash 内核网页前端 · 手机端          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "架构: ${BLUE}${ARCH} → ${ARCH_SUFFIX}${NC}"
echo ""

# ---- Step 1: Install dependencies ----
echo -e "${YELLOW}[1/5] 安装依赖...${NC}"

if ! command -v node &> /dev/null; then
  echo "  安装 Node.js..."
  pkg install x11-repo -y 2>/dev/null || true
  pkg install nodejs -y
fi

if ! command -v nginx &> /dev/null; then
  if ! command -v python3 &> /dev/null; then
    pkg install python -y
  fi
fi

echo -e "  ${GREEN}Node.js $(node -v) ✓${NC}"
echo -e "  ${GREEN}Python $(python3 --version 2>&1 | awk '{print $2}') ✓${NC}"

# ---- Step 2: Build frontend ----
echo -e "${YELLOW}[2/5] 构建前端...${NC}"

if [ ! -f "dist/index.html" ]; then
  echo "  检测到需要安装依赖，执行 npm install..."
  npm install --no-fund --no-audit
fi

echo "  构建中..."
npm run build -- --logLevel error
echo -e "  ${GREEN}前端构建完成 ✓${NC}"

# ---- Step 3: Download mihomo ----
echo -e "${YELLOW}[3/5] 安装 Clash Meta (${MIHOMO_VERSION})...${NC}"

BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

if [ ! -f "$BIN_DIR/mihomo" ]; then
  echo "  下载 ${MIHOMO_FILE}..."
  curl -L -o "/tmp/${MIHOMO_FILE}" "${MIHOMO_URL}"
  gunzip -f "/tmp/${MIHOMO_FILE}"
  mv "/tmp/${MIHOMO_FILE%.gz}" "$BIN_DIR/mihomo"
  chmod +x "$BIN_DIR/mihomo"
  echo -e "  ${GREEN}mihomo 已安装到 ${BIN_DIR}/mihomo ✓${NC}"
else
  echo -e "  ${GREEN}mihomo 已存在 ✓${NC}"
fi

# Add to PATH
if ! grep -q ".local/bin" "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  export PATH="$HOME/.local/bin:$PATH"
fi

# ---- Step 4: Start mihomo ----
echo -e "${YELLOW}[4/5] 启动 Clash Meta...${NC}"

# Kill existing
pkill -f "mihomo" 2>/dev/null || true
sleep 1

CONFIG_DIR="$HOME/.config/mihomo"
mkdir -p "$CONFIG_DIR"
mkdir -p "$CONFIG_DIR/providers"

# Write minimal config if not exists
if [ ! -f "$CONFIG_DIR/config.yaml" ]; then
  cat > "$CONFIG_DIR/config.yaml" << 'YAML'
mixed-port: 7890
allow-lan: true
mode: rule
log-level: info
external-controller: 0.0.0.0:9090

dns:
  enable: true
  enhanced-mode: fake-ip
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query

proxies: []

proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - DIRECT

rules:
  - GEOSITE,cn,DIRECT
  - MATCH,PROXY
YAML
fi

nohup mihomo -d "$CONFIG_DIR" > "$CONFIG_DIR/mihomo.log" 2>&1 &
MIHOMO_PID=$!
sleep 2

if kill -0 $MIHOMO_PID 2>/dev/null; then
  echo -e "  ${GREEN}Clash Meta 已启动 (PID: $MIHOMO_PID) ✓${NC}"
else
  echo -e "  ${RED}Clash Meta 启动失败，查看日志:${NC}"
  cat "$CONFIG_DIR/mihomo.log" | tail -5
  exit 1
fi

# ---- Step 5: Start web server ----
echo -e "${YELLOW}[5/5] 启动 Web 服务器...${NC}"

# Kill existing
pkill -f "python3 -m http.server.*${HYPERION_PORT}" 2>/dev/null || true
sleep 1

cd dist
nohup python3 -m http.server ${HYPERION_PORT} > /dev/null 2>&1 &
SERVER_PID=$!
sleep 1

echo -e "  ${GREEN}Web 服务器已启动 ✓${NC}"

# ---- Done ----
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Hyperion 已在 Termux 中启动！${NC}"
echo ""
echo -e "  ${CYAN}操作说明:${NC}"
echo ""
echo -e "  1. 打开浏览器访问:"
echo -e "     ${BLUE}http://localhost:${HYPERION_PORT}${NC}"
echo ""
echo -e "  2. 进入设置页面，关闭\"代理模式\"开关"
echo -e "     设置 API 地址为 ${BLUE}127.0.0.1${NC}，端口 ${BLUE}${CLASH_PORT}${NC}"
echo -e "     点击\"保存并连接\""
echo ""
echo -e "  3. 将你的订阅配置放入:"
echo -e "     ${BLUE}${CONFIG_DIR}/config.yaml${NC}"
echo ""
echo -e "  ${CYAN}常用命令:${NC}"
echo -e "  停止: ${BLUE}pkill -f mihomo; pkill -f http.server${NC}"
echo -e "  日志: ${BLUE}tail -f ${CONFIG_DIR}/mihomo.log${NC}"
echo -e "  重启: ${BLUE}bash hyperion.sh${NC}"
echo ""
echo -e "  ${CYAN}导入订阅:${NC}"
echo -e "  下载配置到手机:"
echo -e "  ${BLUE}curl -o ${CONFIG_DIR}/config.yaml '你的订阅链接'${NC}"
echo -e "  然后: ${BLUE}pkill mihomo; hyperion.sh${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
