# Persona Guide

Persona Guide 是一个开源的个人形象分析图卡生成工具。上传一张人像照片后，它会调用 OpenAI 兼容的图片生成接口，自动生成一张适合分享和保存的 3:4「个人形象分析方案」图卡。

项目适合用来搭建自己的形象分析小工具，也可以作为 Next.js App Router、异步图片生成任务、本地文件存储等场景的参考实现。

## 预览

![Persona Guide 生成的个人形象分析图卡示例一](.github/preview1.png)

![Persona Guide 生成的个人形象分析图卡示例二](.github/preview2.png)

## 主要功能

- 上传 JPG、PNG、WebP 等人像图片，单张最大 12MB。
- 自动生成包含形象方案、原生妆容、适骨发型、色彩分析、四季穿搭和珠宝搭配的分析图卡。
- 前端支持结果预览、缩放、拖拽查看、下载和保存。
- 服务端使用异步任务处理图片生成，前端会轮询任务状态直到完成。
- 每次生成都会在本地保存输入图、输出图、任务状态和元数据，方便回溯与调试。

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- OpenAI Node SDK
- pnpm

## 快速开始

先安装依赖：

```bash
pnpm install
```

复制环境变量示例：

```bash
cp env.example .env
```

然后编辑 `.env`，填入你的 OpenAI 兼容接口配置：

```bash
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_IMAGE_MODEL=openai/gpt-5.4-image-2
ANALYSIS_STORAGE_DIR=storage
```

启动开发服务：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 上传照片并生成图卡。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 是 | OpenAI 兼容接口的 API Key。 |
| `OPENAI_BASE_URL` | 是 | OpenAI 兼容接口地址，例如 OpenRouter 的 `https://openrouter.ai/api/v1`。 |
| `OPENAI_IMAGE_MODEL` | 是 | 用于生成图卡的图片模型。 |
| `ANALYSIS_STORAGE_DIR` | 否 | 生成记录保存目录，未设置时默认使用项目根目录下的 `storage/`。 |

## 常用命令

```bash
pnpm dev      # 启动本地开发服务
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务
pnpm lint     # 运行 ESLint
```

## 数据保存

每次生成都会创建一个以时间戳命名的目录，默认位于 `storage/` 下，内容通常包括：

- `input.<ext>`：上传的原始图片。
- `output.<ext>`：生成后的图卡。
- `status.json`：异步任务状态，可能为 `queued`、`processing`、`completed` 或 `failed`。
- `metadata.json`：生成时间、模型、文件信息和提示词等元数据。

`storage/` 已加入 `.gitignore`。开源或部署时，请不要提交用户上传图片、生成结果、`.env` 或其他敏感文件。

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

## 许可证

请查看 [`LINCESE`](./LINCESE)。
