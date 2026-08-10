# FORM

FORM 是一个本地优先的个人健身记录 Web 应用，包含身体状态、训练日历、真实 PR 和可编辑周计划。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址。未配置 Supabase 时，身体、训练、PR 和计划数据保存在当前浏览器的 IndexedDB 中。

## AI 功能

复制 `.env.example` 为 `.env.local`，在环境变量中配置：

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.6-terra
```

密钥只在 Next.js 服务端路由读取。未配置密钥时，训练与 PR 仍会正常保存，并使用本地规则生成简短提示；训练截图识别会提示用户改为手动填写。

默认模型来自项目创建时可用的随附 OpenAI 模型参考，部署前可通过 `OPENAI_MODEL` 切换到账号中实际可用的多模态模型。

## 验证

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 数据备份

页面右上角“数据”入口可导出完整 JSON 备份，也可从备份恢复。恢复操作会覆盖当前浏览器中的 FORM 数据。

## 公开部署与云端数据

产品使用同一个 `FitnessRepository` 接口支持两种模式：

- 本地模式：默认使用 IndexedDB，不需要账号或外部服务。
- 云端模式：配置 Supabase 后自动使用匿名认证、Postgres 和 RLS 用户隔离，适合部署到 Vercel 等平台。

云端模式配置步骤：

1. 创建 Supabase 项目，在 SQL Editor 执行 `supabase/schema.sql`。
2. 在 Supabase Authentication 设置中启用 Anonymous Sign-Ins。
3. 在本地 `.env.local` 和部署平台环境变量中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_anon_key
```

`anon key` 是配合 RLS 使用的公开客户端键；不要在仓库中提交 `service_role` 密钥。每个浏览器首次访问会创建独立匿名用户，数据只能由该用户读取和修改。正式公开给长期用户前，建议再增加邮箱登录，使用户可以跨设备恢复账号。

已有本地数据可以先从“数据”入口导出 JSON，启用云端后再从同一入口导入。

## 背景资产

`public/form-gym-background.png` 是为本项目使用内置图像生成工具创作的原创背景图。
