import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    suggestion: { type: "string" },
  },
  required: ["summary", "suggestion"],
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-terra",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `你是克制的健身记录助手。根据下面的结构化记录，用中文输出一句客观总结和一句安全、保守的下次建议。不要诊断疾病，不要把建议写成命令。\n${JSON.stringify(body)}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "fitness_insight",
          strict: true,
          schema: responseSchema,
        },
      },
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch {
    return NextResponse.json({ error: "AI_REQUEST_FAILED" }, { status: 502 });
  }
}
