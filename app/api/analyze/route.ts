import OpenAI from "openai";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
const STORAGE_DIR =
  process.env.ANALYSIS_STORAGE_DIR ??
  path.join(/*turbopackIgnore: true*/ process.cwd(), "storage");

const imageExtensionsByType: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type OpenRouterImageRequest = Omit<
  ChatCompletionCreateParamsNonStreaming,
  "modalities"
> & {
  modalities: Array<"image" | "text">;
  image_config: {
    aspect_ratio: "3:4";
    quality: "low" | "medium" | "high";
  };
};

const analysisPrompt = `
Role: 资深个人形象美学专家

Task: 请基于上传的人像照片，保持人脸五官、脸型及肤色的高度一致性，生成一张结构严谨、风格高级的“个人形象分析方案”。

Core Rules:
真实建模：禁止过度磨皮或改变骨相，所有造型调整须在同一张脸的基础上进行真实推演。
视觉语言：以图为主，文字为辅。采用极简主义排版，背景干净。

构图： 比例 3:4，采用“核心人像 + 侧边对比矩阵”的杂志排版布局。

Analysis Modules:

## 1 形象方案
（位置在左上角，占总体2/8）
直接在人像上进行形象升级，并标注形象升级方案。
（对原图进行抠图，移除背景，只保留人像）
（对抠图进行高清建模，保持人像的五官、脸型及肤色的高度一致性）
（对建模后的人像进行形象升级，并标注形象升级方案）

## 2 原生妆容 
（位置在右上角，占总体1/8）
标注五官优势，给出优化建议。
细节图展示：眉形走势、眼影配色、唇色建议。

## 3 适骨发型
（位置在右上角，原生妆容下方，占总体1/8）
对比展示：3个最适合（修饰脸型、减龄） vs 3个不建议（显脸大、显老气）。
变量涵盖：长短度、卷直度、刘海弧度。

## 4 色彩分析
（位置在中间一行，占总体2/8）
对比展示：4个推荐色（显白、光泽感） vs 2个避雷色（显暗沉、显黄）。
色块应用：在人像肩部衣服上，进行虚拟试色块叠加。

## 5 四季穿搭
（位置在左下角，占总体1/8）
生成春、夏、秋、冬四套代表性穿搭图示，符合当前人像气质。

## 6 珠宝搭配
（位置在右下角，占总体1/8）
对比推荐：珍珠/钻石（柔光） vs 黄金/翡翠（量感） vs 蓝宝石（冷感）。
选2个推荐，选1个不推荐，对错标识。
上排直接在人像脸部进行高清建模呈现。
下排展示珠宝材质细节特写。

整体要简洁，字体要用无衬线字体。
`.trim();

function getImageUrlFromMessage(message: unknown) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const images = "images" in message ? message.images : null;

  if (!Array.isArray(images)) {
    return null;
  }

  for (const image of images) {
    if (!image || typeof image !== "object") {
      continue;
    }

    const imageUrl = "image_url" in image ? image.image_url : null;

    if (imageUrl && typeof imageUrl === "object" && "url" in imageUrl) {
      const url = imageUrl.url;

      if (typeof url === "string" && url.length > 0) {
        return url;
      }
    }
  }

  return null;
}

function formatUploadTimestamp(date: Date, microsecondRemainder: number) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  const microsecond = `${String(date.getMilliseconds()).padStart(3, "0")}${String(
    microsecondRemainder,
  ).padStart(3, "0")}`;

  return `${year}${month}${day}-${hour}${minute}${second}-${microsecond}`;
}

function getUploadFolderName() {
  const uploadTime = new Date();
  const microsecondRemainder = Number(process.hrtime.bigint() % BigInt(1000));

  return {
    folderName: formatUploadTimestamp(uploadTime, microsecondRemainder),
    uploadTime,
  };
}

function getImageExtension(file: File) {
  const extensionFromType = imageExtensionsByType[file.type.toLowerCase()];

  if (extensionFromType) {
    return extensionFromType;
  }

  const extensionFromName = path.extname(file.name).replace(".", "").toLowerCase();

  return /^[a-z0-9]+$/.test(extensionFromName) ? extensionFromName : "bin";
}

function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function createAnalysisDirectory() {
  const { folderName, uploadTime } = getUploadFolderName();
  const directory = path.join(/*turbopackIgnore: true*/ STORAGE_DIR, folderName);

  await mkdir(directory, { recursive: true });

  return { directory, folderName, uploadTime };
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);

  if (!match) {
    throw new Error("生成图片返回了无效的 data URL。");
  }

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const data = match[3];
  const buffer = isBase64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8");

  return { buffer, mimeType };
}

function getExtensionFromMimeType(mimeType: string) {
  return imageExtensionsByType[mimeType.toLowerCase()] ?? "bin";
}

async function downloadGeneratedImage(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    return parseDataUrl(imageUrl);
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`下载生成图片失败：${response.status} ${response.statusText}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());

  return { buffer, mimeType };
}

export async function POST(request: Request) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiBaseUrl = process.env.OPENAI_BASE_URL;
  const imageModel = process.env.OPENAI_IMAGE_MODEL;

  if (!openaiApiKey || !openaiBaseUrl || !imageModel) {
    return NextResponse.json(
      {
        error:
          "缺少图片生成环境变量，请配置 OPENAI_API_KEY、OPENAI_BASE_URL 和 OPENAI_IMAGE_MODEL。",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "请先上传一张人像照片。" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "上传文件必须是图片格式。" }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "图片过大，请上传 12MB 以内的照片。" },
      { status: 400 },
    );
  }

  try {
    const { directory, folderName, uploadTime } = await createAnalysisDirectory();
    const inputExtension = getImageExtension(image);
    const inputFileName = `input.${inputExtension}`;
    const inputPath = path.join(/*turbopackIgnore: true*/ directory, inputFileName);
    const inputBuffer = Buffer.from(await image.arrayBuffer());
    const imageDataUrl = bufferToDataUrl(inputBuffer, image.type);

    await writeFile(inputPath, inputBuffer);

    const client = new OpenAI({
      baseURL: openaiBaseUrl,
      apiKey: openaiApiKey,
    });

    const requestPayload: OpenRouterImageRequest = {
      model: imageModel,
      messages: [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: analysisPrompt },
            {
              type: "image_url" as const,
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      modalities: ["image", "text"],
      image_config: {
        aspect_ratio: "3:4",
        quality: "low",
      },
    };

    const apiResponse = await client.chat.completions.create(
      requestPayload as unknown as ChatCompletionCreateParamsNonStreaming,
    );
    const message = apiResponse.choices[0]?.message;
    const imageUrl = getImageUrlFromMessage(message);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "图片生成成功，但未在响应中找到可展示的图片。" },
        { status: 502 },
      );
    }

    const generatedImage = await downloadGeneratedImage(imageUrl);
    const outputExtension = getExtensionFromMimeType(generatedImage.mimeType);
    const outputFileName = `output.${outputExtension}`;
    const outputPath = path.join(/*turbopackIgnore: true*/ directory, outputFileName);

    await writeFile(outputPath, generatedImage.buffer);
    await writeFile(
      path.join(/*turbopackIgnore: true*/ directory, "metadata.json"),
      JSON.stringify(
        {
          id: folderName,
          createdAt: uploadTime.toISOString(),
          storageDirectory: directory,
          input: {
            fileName: inputFileName,
            originalFileName: image.name,
            mimeType: image.type,
            size: image.size,
          },
          output: {
            fileName: outputFileName,
            mimeType: generatedImage.mimeType,
            size: generatedImage.buffer.byteLength,
            sourceUrl: imageUrl.startsWith("data:") ? null : imageUrl,
          },
          model: imageModel,
          generationPrompt: analysisPrompt,
        },
        null,
        2,
      ),
    );

    return NextResponse.json({ imageUrl });
  } catch (caughtError) {
    console.error("Image generation request failed:", caughtError);

    const errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "图片生成服务暂时不可用，请稍后再试。";

    return NextResponse.json(
      { error: errorMessage },
      { status: 502 },
    );
  }
}
