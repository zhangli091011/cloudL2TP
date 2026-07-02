# 云端软路由节点切换控制面板

基于 Mihomo 的云端代理管理面板。旧路由器通过 L2TP/IPsec VPN 连接云服务器，所有代理节点导入、测速、切换均在云端完成。

## 架构

```
旧路由器 ──(L2TP/IPsec VPN)──> 云服务器 ──(mihomo)──> Clash 订阅节点 ──> 互联网
                                    │
                              [控制面板 Web UI]
```

## 功能

- **订阅管理**: 添加/编辑/删除 Clash/Mihomo YAML 订阅链接，定时自动更新
- **节点列表**: 查看所有解析出的代理节点，支持测速和切换
- **策略组**: 查看 mihomo 代理组，切换当前节点
- **仪表盘**: mihomo 运行状态、当前出口节点、流量统计
- **日志**: 操作日志、错误日志实时查看
- **安全**: JWT 认证、订阅 URL 加密存储、API Secret 不暴露前端

## 技术栈

| 层级   | 技术                                                            |
| ------ | --------------------------------------------------------------- |
| 前端   | React 18 + TypeScript + Vite + Tailwind CSS + Zustand           |
| 后端   | Node.js + TypeScript + Express + better-sqlite3                 |
| 代理   | Mihomo (Clash Meta)                                             |
| 部署   | Docker + Docker Compose                                         |

## 快速开始

### 前置条件

- Node.js 20+
- npm 9+
- (可选) 已安装并运行 Mihomo

### 开发模式（Mock 模式，无需 Mihomo）

```bash
# 1. 复制环境变量
cp .env.example .env
# 编辑 .env，设置 MOCK_MODE=true

# 2. 安装依赖
npm install --legacy-peer-deps

# 3. 启动后端（端口 3001）
npm run dev:api

# 4. 新开终端，启动前端（端口 3000）
npm run dev:web
```

打开 http://localhost:3000 ，默认登录 `admin` / `admin123`

### 生产部署（需要 Mihomo）

#### 1. 安装 Mihomo

参考官方安装指南: [https://wiki.metacubex.one/startup/](https://wiki.metacubex.one/startup/)

**方法 A: DEB 包安装 (Ubuntu/Debian 推荐)**

```bash
# 下载最新稳定版 DEB 包（将版本号替换为最新版本）
VERSION=$(curl -s https://api.github.com/repos/MetaCubeX/mihomo/releases/latest | grep tag_name | cut -d '"' -f4)
curl -LO "https://github.com/MetaCubeX/mihomo/releases/download/${VERSION}/mihomo-linux-amd64-${VERSION}.deb"
sudo dpkg -i mihomo-linux-amd64-*.deb
```

**方法 B: RPM 包安装 (RHEL/CentOS/Fedora)**

```bash
VERSION=$(curl -s https://api.github.com/repos/MetaCubeX/mihomo/releases/latest | grep tag_name | cut -d '"' -f4)
curl -LO "https://github.com/MetaCubeX/mihomo/releases/download/${VERSION}/mihomo-linux-amd64-${VERSION}.rpm"
sudo rpm -ivh mihomo-linux-amd64-*.rpm
```

**方法 C: 二进制手动安装 (通用)**

```bash
# 下载并解压（以 amd64 为例，其他架构见 wiki）
VERSION=$(curl -s https://api.github.com/repos/MetaCubeX/mihomo/releases/latest | grep tag_name | cut -d '"' -f4)
curl -LO "https://github.com/MetaCubeX/mihomo/releases/download/${VERSION}/mihomo-linux-amd64-${VERSION}.gz"
gzip -d mihomo-linux-amd64-*.gz
chmod +x mihomo-linux-amd64-*
sudo mv mihomo-linux-amd64-* /usr/local/bin/mihomo
```

#### 2. 配置 Mihomo

如果你的 config.yaml 类似下面这样（匹配即直连）：

```yaml
mixed-port: 7890
dns:
  enable: true
  ipv6: true
  enhanced-mode: fake-ip
  fake-ip-filter:
    - "*"
    - "+.lan"
    - "+.local"
  nameserver:
    - system
rules:
  - MATCH,DIRECT
```

你只需要**添加两行**即可让控制面板接管：

```yaml
mixed-port: 7890

# 在文件顶部或任意位置添加这两行
external-controller: '0.0.0.0:9090'
secret: 'your-secret-key'

dns:
  enable: true
  ipv6: true
  enhanced-mode: fake-ip
  fake-ip-filter:
    - "*"
    - "+.lan"
    - "+.local"
  nameserver:
    - system
rules:
  - MATCH,DIRECT
```

> 添加订阅并更新后，控制面板会**自动重写整个 config.yaml**（备份旧配置到 `/etc/mihomo/backups/`），把 `MATCH,DIRECT` 替换为代理组规则，并注入订阅解析出的节点列表。所以你不需要手动写代理配置，只需确保 `external-controller` 和 `secret` 这两个字段存在即可。

#### 3. 启动控制面板

```bash
# 创建数据目录
mkdir -p data

# 编辑 .env
cp .env.example .env
# 设置:
#   MIHOMO_API_URL=http://127.0.0.1:9090
#   MIHOMO_API_SECRET=your-secret-key
#   MOCK_MODE=false
#   JWT_SECRET=<随机生成>
#   ADMIN_PASSWORD=<你的密码>

# 启动
docker-compose up -d
```

或直接运行：

```bash
cp .env.example .env
npm install --legacy-peer-deps
npm run build
NODE_ENV=production node apps/api/dist/index.js
```

面板运行在 http://your-server-ip:3001

---

## L2TP/IPsec VPN 部署说明

### 强烈建议使用以下方法在云服务器上配置 L2TP/IPsec

推荐脚本: [hwdsl2/setup-ipsec-vpn](https://github.com/hwdsl2/setup-ipsec-vpn)

```bash
# 一键安装
wget https://get.vpnsetup.net -O vpn.sh
sudo sh vpn.sh

# 安装完成后会输出 VPN 账号信息
# 记录: VPN IP、PSK、用户名、密码
```

### 需要开放的端口（云服务器安全组/防火墙）

| 协议 | 端口    | 用途        |
| ---- | ------- | ----------- |
| UDP  | 500     | IKE (IPsec) |
| UDP  | 4500    | NAT-T       |
| UDP  | 1701    | L2TP        |

### 旧路由器配置

1. WAN 连接类型: **L2TP**
2. L2TP 服务器地址: **你的云服务器公网 IP**
3. IPsec 预共享密钥: **VPN 安装脚本输出的 PSK**
4. 用户名/密码: **VPN 安装脚本输出的账号**
5. 其他保持默认

### VPN 流量如何进入 Mihomo？

旧路由器连接 L2TP VPN 后，所有流量进入云服务器的 `ppp0` 虚拟网卡。需要通过以下方式之一将流量导入 Mihomo：

#### 方法 A: TProxy (推荐)

```bash
# 创建路由规则，将 VPN 客户端流量转发到 Mihomo TProxy 端口
ip rule add fwmark 1 table 100
ip route add local 0.0.0.0/0 dev lo table 100
iptables -t mangle -A PREROUTING -i ppp+ -j TPROXY --on-port 7892 --tproxy-mark 1
```

在 mihomo config.yaml 中启用 TProxy:

```yaml
tproxy-port: 7892
tun:
  enable: false
```

#### 方法 B: TUN 模式

在 mihomo config.yaml 中:

```yaml
tun:
  enable: true
  stack: system
  auto-route: true
  auto-detect-interface: true
```

#### 方法 C: Redirect (简化)

```bash
# 将 VPN 流量 REDIRECT 到 Mihomo HTTP/SOCKS 端口
iptables -t nat -A PREROUTING -i ppp+ -p tcp -j REDIRECT --to-port 7890
```

> **安全警告**: 以上命令仅为例。生产环境请仔细测试并绑定到特定 VPN 接口。

---

## API 文档

所有 API 需要 `Authorization: Bearer <token>` 头。

| 方法   | 路径                              | 说明               |
| ------ | --------------------------------- | ------------------ |
| POST   | `/api/auth/login`                 | 登录获取 JWT       |
| POST   | `/api/auth/logout`                | 登出               |
| GET    | `/api/me`                         | 获取当前用户       |
| GET    | `/api/dashboard`                  | 仪表盘数据         |
| GET    | `/api/mihomo/status`              | Mihomo 状态        |
| POST   | `/api/mihomo/reload`              | 重载配置           |
| GET    | `/api/mihomo/proxies`             | 代理列表           |
| PUT    | `/api/mihomo/proxies/:groupName`  | 切换节点           |
| GET    | `/api/subscriptions`              | 订阅列表           |
| POST   | `/api/subscriptions`              | 添加订阅           |
| PUT    | `/api/subscriptions/:id`          | 编辑订阅           |
| DELETE | `/api/subscriptions/:id`          | 删除订阅           |
| POST   | `/api/subscriptions/:id/update`   | 手动更新订阅       |
| GET    | `/api/nodes`                      | 节点列表           |
| POST   | `/api/nodes/test-all`             | 全部测速           |
| POST   | `/api/nodes/:id/test`             | 单节点测速         |
| POST   | `/api/nodes/:id/select`           | 选择当前出口节点   |
| GET    | `/api/logs`                       | 操作日志           |
| DELETE | `/api/logs`                       | 清空日志           |

---

## 环境变量

| 变量                        | 默认值                     | 说明                           |
| --------------------------- | -------------------------- | ------------------------------ |
| `API_PORT`                  | `3001`                     | 后端 API 端口                  |
| `JWT_SECRET`                | (必改)                     | JWT 签名密钥，至少 32 字符     |
| `ADMIN_PASSWORD`            | `admin123`                 | 默认管理员密码                 |
| `MIHOMO_API_URL`            | `http://127.0.0.1:9090`   | Mihomo External Controller URL |
| `MIHOMO_API_SECRET`         | (空)                       | Mihomo API Secret              |
| `MIHOMO_CONFIG_DIR`         | `/etc/mihomo`             | Mihomo 配置目录                |
| `MIHOMO_CONFIG_BACKUP_DIR`  | `/etc/mihomo/backups`     | 配置备份目录                   |
| `DATABASE_PATH`             | `./data/panel.db`          | SQLite 数据库文件路径          |
| `MOCK_MODE`                 | `false`                    | 开发模式：使用模拟数据         |
| `SUBSCRIPTION_UPDATE_INTERVAL` | `3600`                  | 订阅自动更新间隔 (秒)          |
| `LOG_LEVEL`                 | `info`                     | 日志级别                       |

---

## 项目结构

```
cloud-router-panel/
├── apps/
│   ├── api/                  # 后端 API
│   │   └── src/
│   │       ├── routes/       # API 路由
│   │       ├── services/     # 业务逻辑层
│   │       ├── middleware/   # 中间件 (JWT, 错误处理)
│   │       ├── db/           # 数据库
│   │       ├── utils/        # 工具函数 (加密, YAML 解析, 配置生成)
│   │       ├── app.ts        # Express 应用
│   │       ├── config.ts     # 配置
│   │       └── index.ts      # 入口
│   └── web/                  # 前端
│       └── src/
│           ├── components/   # 通用组件
│           ├── pages/        # 页面
│           ├── store/        # Zustand 状态管理
│           └── api.ts        # API Client
├── packages/
│   └── shared/               # 共享类型
├── docker/                   # Docker 相关配置
├── scripts/                  # 工具脚本
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 安全注意事项

1. **不要公开敏感信息**: JWT_SECRET、订阅链接中的 token、IPsec PSK、VPN 密码等绝不提交到 Git
2. **修改默认密码**: 首次启动后立即修改 ADMIN_PASSWORD
3. **HTTPS**: 生产环境建议使用 Nginx/Caddy 反向代理并配置 HTTPS
4. **防火墙**: 仅开放必要的端口，Mihomo External Controller (9090) 不要暴露到公网
5. **VPN 安全**: 使用强 PSK (至少 20 位随机字符) 和复杂的 VPN 密码
6. **定期更新**: 保持 Mihomo 和控制面板的依赖更新

---

## License

MIT
