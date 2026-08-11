# 腾讯云部署手册

这套配置用于腾讯云轻量应用服务器。它在一台服务器中运行 Next.js、PostgreSQL 与 Caddy，不依赖 Vercel 或 Neon。

## 1. 服务器与域名

建议起步规格：Ubuntu 24.04、2 核 CPU、2 GB 内存并启用 Swap、40 GB SSD。开放防火墙端口 `22`、`80`、`443`，数据库端口不对公网开放。

首次部署可用 `APP_SITE_ADDRESS=:80` 和 `BETTER_AUTH_URL=http://公网IP` 通过 HTTP 验证。备案并配置域名后，将两者分别改为域名和 `https://域名`，Caddy 会自动签发 HTTPS 证书。

## 2. 安装运行环境

在服务器安装 Git、Docker Engine 和 Docker Compose Plugin。确认：

```bash
git --version
docker --version
docker compose version
```

## 3. 首次部署

```bash
sudo mkdir -p /opt/form-fitness
sudo chown "$USER":"$USER" /opt/form-fitness
git clone https://github.com/peacepushingzhang/Gym-strength.git /opt/form-fitness
cd /opt/form-fitness
cp .env.server.example .env
chmod 600 .env
```

编辑 `.env`，设置站点地址、认证 URL 以及两个随机密钥：

```bash
openssl rand -hex 32
openssl rand -base64 48
```

不要把随机值粘贴到 GitHub、工单、聊天或服务器日志中。数据库密码建议使用十六进制结果，避免连接 URL 转义问题。

启动服务：

```bash
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs --tail=100 app migrate caddy
```

首次访问 `http://公网IP/api/health`，预期返回 `{"ok":true}`。启用域名后改用 `https://你的域名/api/health`。

## 4. 自动部署

在 GitHub 仓库中配置：

- Actions secrets：`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`
- Actions variable：`DEPLOY_PORT`，默认 `22`
- Actions variable：`DEPLOY_ENABLED=true`

部署用户的 SSH 公钥需要写入服务器的 `~/.ssh/authorized_keys`。之后每次推送 `main`，GitHub Actions 会在服务器执行 `git pull --ff-only` 和 `sudo docker compose up -d --build --remove-orphans`。

## 5. 数据备份

`deploy/backup.sh` 会创建压缩的 PostgreSQL 备份，并保留最近 14 天。先测试：

```bash
sudo mkdir -p /opt/form-fitness-backups
sudo /opt/form-fitness/deploy/backup.sh
ls -lh /opt/form-fitness-backups
```

确认成功后通过 root 的 crontab 每天执行：

```cron
20 3 * * * /opt/form-fitness/deploy/backup.sh
```

正式运营前应再将备份同步到腾讯云 COS，避免服务器磁盘故障时同时丢失应用与备份。

## 6. 运维检查

```bash
sudo docker compose ps
sudo docker compose logs --tail=200 app
sudo docker compose pull db caddy
sudo docker compose up -d --build
```

不要将 PostgreSQL 的 `5432` 端口映射到公网。更新系统、Docker 镜像或应用前先执行一次数据库备份。
