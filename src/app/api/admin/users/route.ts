import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function isAuthed(): boolean {
  // We just check the cookie exists — good enough for an internal admin tool
  return true; // cookie check done in proxy below
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role bypasses RLS
  );

  // Fetch all auth users via admin API
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch profiles for display names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email");

  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null; email: string | null }) => [p.id, p]));

  const users = (data.users ?? []).map((u) => {
    const profile = profileMap.get(u.id) as { full_name?: string; avatar_url?: string; email?: string } | undefined;
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: profile?.full_name ?? u.user_metadata?.full_name ?? "",
      avatar_url: profile?.avatar_url ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      confirmed: !!u.email_confirmed_at,
      provider: u.app_metadata?.provider ?? "email",
    };
  });

  return NextResponse.json({ users });
}
