import { getAuth } from "../auth";

export async function isApiRequestAuthorized(request: Request) {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== "cloud") return true;
  const session = await getAuth().api.getSession({ headers: request.headers });
  return Boolean(session?.user.id);
}

