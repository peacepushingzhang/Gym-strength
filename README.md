# FORM

FORM 是一个本地优先的个人健身记录 Web 应用，包含身体状态与历史、训练日历、真实 PR 和可编辑周计划。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址。默认 `NEXT_PUBLIC_DATA_MODE=local`，身体、训练、PR 和计划数据保存在当前浏览器的 IndexedDB 中，不需要数据库或账号。

## 数据模式

产品通过统一的 `FitnessRepository` 支持两种模式：

- `local`：前端 IndexedDB，适合个人离线使用与无配置预览。
- `cloud`：Next.js Serverless Route Handler + Neon PostgreSQL + Drizzle + Better Auth，适合公开部署和多用户使用。

云端模式中，浏览器只访问 `/api/fitness`；数据库连接串和认证密钥只存在于服务端。每一笔业务查询都根据服务端验证的 session 添加 `userId` 条件，客户端不能指定其他用户的 ID。

复制 `.env.example` 为 `.env.local`，配置：

```bash
NEXT_PUBLIC_DATA_MODE=cloud
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=至少32位的高熵随机字符串
BETTER_AUTH_URL=http://localhost:3000
```

可使用 `openssl rand -base64 32` 在本机生成 `BETTER_AUTH_SECRET`。不要把 `.env.local`、数据库连接串或认证密钥提交到 GitHub。

如果开发服务器实际运行在 `http://localhost:3100`，`BETTER_AUTH_URL` 也必须改为相同地址。部署到 Vercel 后，将它改为正式站点的 HTTPS 地址。

## 数据库迁移

Schema 位于 `lib/db/schema.ts`，包含 Better Auth 的 4 张认证表和 5 张健身业务表。生成并执行迁移：

```bash
pnpm db:generate
pnpm db:migrate
```

业务表使用 `user_id + id` 联合主键，并以外键连接认证用户；删除账号时会级联清理其健身数据。

## AI 功能

在环境变量中按需配置：

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.6-terra
```

密钥只在 Next.js 服务端路由读取。未配置密钥时，训练与 PR 仍会正常保存，并使用本地规则生成简短提示；训练截图识别会提示用户改为手动填写。

## 备份与模式切换

页面右上角“数据”入口可导出完整 JSON，也可从备份恢复。恢复会替换当前模式、当前用户范围内的全部数据。

应用不会自动把 IndexedDB 数据上传到云端。切换前先在本地模式导出 JSON，再启用云端模式、登录并手动导入，确保用户明确确认数据迁移。

## 验证

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 公开发布前仍需完成

- 创建 Neon 项目并执行迁移。
- 在 Vercel 配置上述服务端环境变量。
- 接入邮件服务后启用邮箱验证和找回密码；当前邮箱密码登录适合第一阶段内测。
- 配置正式域名后同步更新 `BETTER_AUTH_URL`。

## 背景资产

`public/form-gym-background.png` 是为本项目使用内置图像生成工具创作的原创背景图。
