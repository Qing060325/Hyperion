<div align="center">

<img src="public/icons/favicon.svg" alt="Hyperion" width="80" height="80" />

# Hyperion

**新一代 Clash 内核网页管理面板**

基于 **SolidJS + Vite + TypeScript** 打造的高性能、现代化代理管理工具

[![Release](https://img.shields.io/github/v/release/Qing060325/Hyperion)](https://github.com/Qing060325/Hyperion/releases)
[![License](https://img.shields.io/github/license/Qing060325/Hyperion)](LICENSE)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2C4F7C)](https://www.solidjs.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker&logoColor=white)]()

---

</div>

> **Hyperion（海珀利昂）** — 取自希腊神话中的光明泰坦神，象征光芒与力量。
> 以暗黑科技美学为设计语言，为 Clash 代理内核提供极致的可视化管理体验。

---

## 核心功能

### 仪表盘
- 实时流量图表（Canvas 渲染，双通道辉光特效）
- 上传/下载速率实时监控
- 活跃连接数、内存使用、运行时间统计
- 一键切换 规则 / 全局 / 直连 模式

### 代理管理
- 可折叠代理组层级结构
- 节点卡片：名称、协议标签、实时延迟
- 五级延迟颜色编码（🟢优秀 → ⚪未知）
- 单节点 / 全部延迟测试
- 节点搜索过滤、代理集管理

### 连接管理
- WebSocket 驱动的实时连接列表
- 多维排序（主机/进程/规则/下载/上传）
- 关键词精确过滤
- 单条/批量关闭连接
- 代理链路可视化

### 规则管理
- 按类型着色的规则表（DOMAIN / IP-CIDR / GEOSITE 等）
- 全文搜索、规则集管理
- 可视化规则编辑器（拖拽排序、批量导入导出）

### 日志系统
- WebSocket 实时日志流
- 四级过滤（Debug / Info / Warning / Error）
- 关键词搜索、自动滚动控制
- 日志导出（TXT / JSON / CSV）

### 配置与 DNS
- 配置重载、GeoIP 数据库更新、内核重启
- DNS 查询工具（A / AAAA / CNAME / TXT / MX / NS）
- Fake-IP 缓存管理

### 订阅管理
- 订阅增删改查、启用/禁用控制
- 流量已用/总量进度条可视化
- 一键批量更新

### 系统设置
- 语言切换（中文 / 英文）
- API 地址、端口、密钥配置
- 主题切换（暗色 / 亮色 / 跟随系统）
- 系统代理、TUN 模式、允许局域网
- 全局快捷键系统、通知管理

---

## v0.3.0 亮点

| 功能 | 说明 |
|------|------|
| 🚀 **欢迎向导** | 首次启动引导，自动检测 Clash 内核 |
| 📝 **规则编辑器** | 可视化编辑，拖拽排序，YAML 预览 |
| 🎯 **策略组拖拽** | 节点拖拽排序调整 |
| 📁 **多配置管理** | 多文件切换、导入导出、远程更新 |
| 🌐 **网络模式** | TUN 模式开关、系统代理配置 |
| 🗺️ **连接详情** | IP 地理定位、连接详情面板 |
| 🎨 **主题系统** | 多款内置主题，深色/浅色切换 |
| ⌨️ **快捷键** | 全局快捷键，可自定义绑定 |
| 🔔 **通知系统** | 连接错误、订阅到期、新版本提醒 |

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | SolidJS 1.9 | 细粒度响应式，无 VDOM |
| **开发语言** | TypeScript 5.7 | 全栈类型安全 |
| **路由** | @solidjs/router | SolidJS 官方路由 |
| **状态管理** | Solid.js Signals + Store | 原生响应式，零依赖 |
| **样式方案** | Tailwind CSS 4.0 + DaisyUI | 原子化 CSS，组件库 |
| **拖拽** | @dnd-kit | 可排序列表/网格 |
| **构建工具** | Vite 6 | 极速 HMR |
| **可视化** | Canvas API | 高性能实时图表 |
| **实时通信** | WebSocket | 流量/日志/连接三路复用 |
| **国际化** | 自研 i18n | 中英文双语 |
| **验证** | Zod | 运行时类型校验 |

---

## 项目结构

```
Hyperion/
├── src/
│   ├── App.tsx                  # 根组件 + 路由
│   ├── main.tsx                 # 入口
│   ├── index.css                # 全局样式 + 设计 Token
│   ├── pages/                   # 页面组件
│   │   ├── Dashboard.tsx        # 仪表盘
│   │   ├── Proxies.tsx          # 代理管理
│   │   ├── Connections.tsx      # 连接管理
│   │   ├── Rules.tsx / RuleEditorPage.tsx  # 规则管理
│   │   ├── Logs.tsx             # 日志
│   │   ├── Configs.tsx          # 配置管理
│   │   ├── DNS.tsx              # DNS 工具
│   │   ├── Subscriptions.tsx    # 订阅管理
│   │   └── Settings.tsx         # 系统设置
│   ├── components/              # 通用组件
│   │   ├── layout/              # 布局（Sidebar/MainLayout/MobileNav）
│   │   ├── proxies/             # 代理相关（拖拽卡片/列表/管理器）
│   │   ├── rules/               # 规则编辑器组件
│   │   ├── connections/         # 连接详情
│   │   ├── wizard/              # 欢迎向导（4步引导）
│   │   ├── settings/            # 设置组件
│   │   ├── logs/                # 日志过滤
│   │   ├── network/             # 网络模式切换
│   │   ├── extensions/          # 主题选择器
│   │   └── profiles/            # 配置管理
│   ├── services/                # API 服务层
│   │   ├── clash-api.ts         # RESTful API 封装
│   │   ├── clash-ws.ts          # WebSocket 管理器
│   │   ├── clash-detector.ts    # 内核自动检测
│   │   ├── hotkeys.ts           # 快捷键服务
│   │   ├── geoip.ts             # GeoIP 查询
│   │   ├── notification.ts      # 通知服务
│   │   └── profile-manager.ts   # 配置文件管理
│   ├── stores/                  # 全局状态
│   │   ├── clash.ts             # Clash 连接状态
│   │   ├── theme.ts             # 主题状态
│   │   ├── settings.ts          # 应用设置
│   │   ├── profiles.ts          # 配置文件状态
│   │   ├── wizard.ts            # 向导状态
│   │   └── proxy-drag.ts        # 拖拽状态
│   ├── types/                   # TypeScript 类型
│   ├── hooks/                   # 自定义 Hooks
│   ├── utils/                   # 工具函数
│   └── i18n/                    # 国际化
├── public/                      # 静态资源
├── config/                      # 配置文件
├── test/                        # 测试数据
├── docs/                        # 文档
├── .github/workflows/           # CI/CD
├── Dockerfile                   # Docker 构建
├── nginx.conf                   # Nginx 配置
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
└── package.json
```

---

## Clash API 通信

Hyperion 通过 Clash RESTful API 和 WebSocket 与内核通信：

**RESTful API**

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/version` | 获取版本 |
| GET/PATCH | `/configs` | 读取/更新配置 |
| PUT | `/configs` | 重载配置 |
| POST | `/configs/geo` | 更新 GeoIP |
| GET | `/proxies` | 获取代理列表 |
| PUT | `/proxies/{name}` | 切换节点 |
| GET | `/proxies/{name}/delay` | 延迟测试 |
| GET | `/rules` | 获取规则 |
| GET/DELETE | `/connections` | 获取/关闭连接 |
| GET | `/dns/query` | DNS 查询 |

**WebSocket 流**

| 端点 | 数据 | 说明 |
|------|------|------|
| `/traffic` | `{ up, down }` | 实时速率 |
| `/logs` | `{ type, payload }` | 日志推送 |
| `/connections` | 连接详情 | 连接更新 |

---

## 快速开始

### 环境要求

| 依赖 | 最低版本 |
|------|----------|
| Node.js | 18+ |
| pnpm | 8+ |

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Qing060325/Hyperion.git
cd Hyperion

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build
```

### Docker 部署

```bash
docker build -t hyperion .
docker run -d -p 8080:80 hyperion
```

---

## 开发路线

- [x] v0.1.0-beta — 核心功能（仪表盘/代理/连接/规则/日志/配置）
- [x] v0.3.0 — 规则编辑器、欢迎向导、多配置管理、主题系统、快捷键
- [ ] v0.5.0 — 配置合并（Merge）与脚本（Script）支持
- [ ] v0.8.0 — 性能优化（虚拟列表、WebGPU 图表）
- [ ] v1.0.0 — 正式版发布

---

## 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 提交 Pull Request

---

## 许可证

[MIT License](LICENSE)

---

<div align="center">

**Hyperion** — 以光明之名，掌控网络之流

</div>
