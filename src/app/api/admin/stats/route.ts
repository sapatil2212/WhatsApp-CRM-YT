import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function GET() {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: authData } = await db.auth.admin.listUsers({ perPage: 500 });
  const users = (authData?.users ?? []) as { id: string; created_at?: string; email_confirmed_at?: string }[];
  const userIds = users.map(u => u.id);

  const now = new Date();
  const monthlySignups: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const count = users.filter(u => (u.created_at ?? "").startsWith(key)).length;
    monthlySignups.push({ month: d.toLocaleString("en-US", { month: "short" }), count });
  }

  if (userIds.length === 0) {
    return NextResponse.json({
      totalUsers: 0, activeUsers: 0, confirmedUsers: 0,
      totalContacts: 0, totalConversations: 0, openConversations: 0,
      monthlySignups,
    });
  }

  const [waConfigs, contacts, conversations] = await Promise.all([
    db.from("whatsapp_config").select("user_id, status").in("user_id", userIds),
    db.from("contacts").select("user_id").in("user_id", userIds),
    db.from("conversations").select("user_id, status").in("user_id", userIds),
  ]);

  const waMap = new Map(
    ((waConfigs.data ?? []) as { user_id: string; status: string }[])
      .map(w => [w.user_id, w.status])
  );

  const activeCount    = users.filter(u => waMap.get(u.id) === "connected").length;
  const confirmedCount = users.filter(u => !!u.email_confirmed_at).length;

  return NextResponse.json({
    totalUsers:         users.length,
    activeUsers:        activeCount,
    confirmedUsers:     confirmedCount,
    totalContacts:      (contacts.data ?? []).length,
    totalConversations: (conversations.data ?? []).length,
    openConversations:  ((conversations.data ?? []) as { status: string }[])
                          .filter(c => c.status === "open").length,
    monthlySignups,
  });
}
