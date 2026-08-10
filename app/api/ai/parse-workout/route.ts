import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: "string" },
    planName: { type: "string" },
    calories: { type: "number" },
    notes: { type: "string" },
    exercises: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          sets: { type: "number" },
          reps: { type: "number" },
          weight: { type: "number" },
        },
        required: ["name", "sets", "reps", "weight"],
      },
    },
  },
  required: ["date", "planName", "calories", "notes", "exercises"],
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File) || !image.type.startsWith("image/")) {
      return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 400 });
    }
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 400 });
    }

    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-terra",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "读取这张训练记录截图。仅提取明确可见的信息；无法判断的数值填 0，日期未知时填空字符串。动作同重量和次数的连续组可以合并。返回结构化 JSON，不要解释。",
            },
            {
              type: "input_image",
              image_url: `data:${image.type};base64,${base64}`,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "workout_screenshot",
          strict: true,
          schema: responseSchema,
        },
      },
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch {
    return NextResponse.json({ error: "IMAGE_PARSE_FAILED" }, { status: 502 });
  }
}
