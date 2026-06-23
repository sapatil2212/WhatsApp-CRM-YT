import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_USER = (process.env.SUPER_ADMIN_USERNAME ?? process.env.ADMIN_EMAIL    ?? "admin@agency.com");
const ADMIN_PASS = (process.env.SUPER_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "admin123");
const SESSION_TOKEN = "admin_session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Accept both field names — login form sends `username`, some callers send `email`
  const submitted_user = (body.username ?? body.email ?? "").trim().toLowerCase();
  const submitted_pass = (body.password ?? "").trim();

  const expected_user = ADMIN_USER.trim().toLowerCase();
  const expected_pass = ADMIN_PASS.trim();

  if (submitted_user !== expected_user || submitted_pass !== expected_pass) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_TOKEN, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_TOKEN);
  return NextResponse.json({ ok: true });
}
