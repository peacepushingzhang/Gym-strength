import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  deleteFitnessRecordSchema,
  fitnessResourceSchema,
  importFitnessDataSchema,
  saveFitnessRecordSchema,
} from "@/lib/apiSchemas";
import {
  deleteFitnessRecord,
  exportFitnessData,
  listFitnessResource,
  replaceFitnessData,
  saveFitnessRecord,
} from "@/lib/server/fitnessData";

export const runtime = "nodejs";

const unauthorized = () => NextResponse.json({ error: "请先登录" }, { status: 401 });
const invalidRequest = (message = "请求数据格式不正确") =>
  NextResponse.json({ error: message }, { status: 400 });

async function getUserId(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  return session?.user.id;
}

export async function GET(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const resource = new URL(request.url).searchParams.get("resource");
  if (!resource) return NextResponse.json(await exportFitnessData(userId));

  const parsedResource = fitnessResourceSchema.safeParse(resource);
  if (!parsedResource.success) return invalidRequest("未知的数据类型");
  return NextResponse.json(await listFitnessResource(userId, parsedResource.data));
}

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const parsed = saveFitnessRecordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidRequest();
  await saveFitnessRecord(userId, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const url = new URL(request.url);
  const parsed = deleteFitnessRecordSchema.safeParse({
    resource: url.searchParams.get("resource"),
    id: url.searchParams.get("id"),
  });
  if (!parsed.success) return invalidRequest();
  await deleteFitnessRecord(userId, parsed.data.resource, parsed.data.id);
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const parsed = importFitnessDataSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidRequest("备份文件格式不正确");
  await replaceFitnessData(userId, parsed.data);
  return NextResponse.json({ ok: true });
}
