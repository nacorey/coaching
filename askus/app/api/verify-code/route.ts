import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { code } = await req.json();
  const accessCode = process.env.ACCESS_CODE;

  if (!accessCode || code !== accessCode) {
    return new Response("Invalid code", { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("askus_access", "granted", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return Response.json({ ok: true });
}
