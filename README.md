# Persona Guide

一个基于 Next.js 的个人形象分析图卡生成工具。用户上传人像照片后，应用会调用 OpenAI 兼容的图片生成接口，输出一张 3:4 的「个人形象分析方案」图卡，并在本地保存输入图、输出图和元数据。

## 功能

- 上传 JPG、PNG、WebP 等图片，单张最大 12MB。
- 生成包含形象方案、原生妆容、适骨发型、色彩分析、四季穿搭和珠宝搭配的分析图卡。
- 支持结果预览、缩放、拖拽查看、下载和保存。
- 图片生成以异步任务执行，前端会轮询任务状态直到生成完成。
- 服务端会把每次生成记录保存到 `storage/<timestamp>/`。

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- OpenAI Node SDK，使用 OpenAI 兼容接口
- pnpm

## 本地开发

安装依赖：

```bash
pnpm install
```

复制环境变量示例并填写真实值：

```bash
cp env.example .env
```

启动开发服务：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 使用应用。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI 兼容接口的 API Key。 |
| `OPENAI_BASE_URL` | OpenAI 兼容接口地址，例如 OpenRouter 的 `https://openrouter.ai/api/v1`。 |
| `OPENAI_IMAGE_MODEL` | 用于生成图卡的图片模型。 |
| `ANALYSIS_STORAGE_DIR` | 生成记录保存目录。未设置时默认使用项目根目录下的 `storage`。 |

## 常用命令

```bash
pnpm dev      # 启动本地开发服务
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务
pnpm lint     # 运行 ESLint
```

## 数据保存

每次生成都会创建一个以时间戳命名的目录，内容通常包括：

- `input.<ext>`：上传的原始图片。
- `output.<ext>`：生成后的图卡。
- `status.json`：异步任务状态，可能为 `queued`、`processing`、`completed` 或 `failed`。
- `metadata.json`：生成时间、模型、文件信息和提示词等元数据。

`storage/` 已加入 `.gitignore`，不要提交用户上传图片、生成结果或 `.env` 等敏感文件。

## API 行为

- `POST /api/analyze`：接收表单字段 `image`，校验通过后保存原图并创建异步生成任务，成功时返回 `202` 和 `{ "jobId": "..." }`。
- `GET /api/analyze?jobId=<id>`：查询任务状态。任务完成后响应中会包含可展示的 `imageUrl`。
- `GET /api/analyze?jobId=<id>&asset=output`：读取已完成任务的输出图卡，供页面预览和下载使用。

## Docker 部署

项目提供了 standalone 构建的 `Dockerfile` 和简单部署脚本：

```bash
./deploy.sh
```

脚本会拉取最新代码、构建镜像、重建 `persona-guide` 容器，并将宿主机的 `.env` 和 `storage/` 挂载到容器中。默认对外端口为 `3300`，容器内服务端口为 `3000`。
