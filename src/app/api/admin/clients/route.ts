import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

// GET /api/admin/clients
export async function GET() {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminClient();

  const { data: authData, error: authErr } = await db.auth.admin.listUsers({ perPage: 500 });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  const users = authData?.users ?? [];
  const userIds = users.map(u => u.id);
  if (userIds.length === 0) return NextResponse.json({ clients: [] });

  // Fetch all related data in parallel
  const [profiles, contacts, conversations, waConfigs, broadcasts, automations, clinics] =
    await Promise.all([
      db.from("profiles").select("user_id, full_name, email, avatar_url, role, created_at"),
      db.from("contacts").select("user_id").in("user_id", userIds),
      db.from("conversations").select("user_id, status, created_at").in("user_id", userIds),
      db.from("whatsapp_config").select("user_id, status, phone_number_id, waba_id, connected_at").in("user_id", userIds),
      db.from("broadcasts").select("user_id, status, total_recipients, sent_count").in("user_id", userIds),
      db.from("automations").select("user_id, is_active").in("user_id", userIds),
      db.from("clinics").select("user_id, clinic_name, clinic_type, city, state, phone").in("user_id", userIds),
    ]);

  // Build lookup maps
  const profileMap    = new Map((profiles.data    ?? []).map(p => [p.user_id, p]));
  const waMap         = new Map((waConfigs.data   ?? []).map(w => [w.user_id, w]));
  const clinicMap     = new Map((clinics.data     ?? []).map(c => [c.user_id, c]));

  const contactCount  = new Map<string, number>();
  const convCount     = new Map<string, number>();
  const openConvCount = new Map<string, number>();
  const broadcastCount= new Map<string, number>();
  const autoCount     = new Map<string, number>();

  for (const c of (contacts.data ?? []))
    contactCount.set(c.user_id, (contactCount.get(c.user_id) ?? 0) + 1);

  for (const c of (conversations.data ?? [])) {
    convCount.set(c.user_id, (convCount.get(c.user_id) ?? 0) + 1);
    if (c.status === "open")
      openConvCount.set(c.user_id, (openConvCount.get(c.user_id) ?? 0) + 1);
  }

  for (const b of (broadcasts.data ?? []))
    broadcastCount.set(b.user_id, (broadcastCount.get(b.user_id) ?? 0) + 1);

  for (const a of (automations.data ?? []))
    autoCount.set(a.user_id, (autoCount.get(a.user_id) ?? 0) + 1);

  const clients = users.map(u => {
    const profile = profileMap.get(u.id);
    const wa      = waMap.get(u.id);
    const clinic  = clinicMap.get(u.id);
    const isBanned = !!(u as any).banned_until &&
      new Date((u as any).banned_until) > new Date();

    return {
      id:              u.id,
      name:            profile?.full_name ?? u.user_metadata?.full_name ?? "",
      email:           u.email ?? profile?.email ?? "",
      avatar_url:      profile?.avatar_url ?? null,
      role:            profile?.role ?? "user",
      // Account status
      is_active:       !isBanned && !!u.email_confirmed_at,
      is_banned:       isBanned,
      banned_until:    (u as any).banned_until ?? null,
      confirmed:       !!u.email_confirmed_at,
      provider:        u.app_metadata?.provider ?? "email",
      // Timestamps
      joined_at:       u.created_at,
      last_sign_in:    u.last_sign_in_at ?? null,
      // WhatsApp
      wa_connected:    wa?.status === "connected",
      wa_status:       wa?.status ?? "disconnected",
      wa_phone_id:     wa?.phone_number_id ?? null,
      wa_waba_id:      wa?.waba_id ?? null,
      wa_connected_at: wa?.connected_at ?? null,
      // Healthcare
      clinic_name:     clinic?.clinic_name ?? null,
      clinic_type:     clinic?.clinic_type ?? null,
      clinic_city:     clinic?.city ?? null,
      clinic_phone:    clinic?.phone ?? null,
      // Stats
      contacts:        contactCount.get(u.id) ?? 0,
      conversations:   convCount.get(u.id) ?? 0,
      open_conversations: openConvCount.get(u.id) ?? 0,
      broadcasts:      broadcastCount.get(u.id) ?? 0,
      automations:     autoCount.get(u.id) ?? 0,
    };
  });

  return NextResponse.json({ clients });
}

// PATCH /api/admin/clients — activate or deactivate a user
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await req.json() as { id: string; action: "activate" | "deactivate" };
  if (!id || !action)
    return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

  const db = adminClient();

  if (action === "deactivate") {
    // Ban for 100 years = effectively permanent until manually lifted
    const { error } = await db.auth.admin.updateUserById(id, {
      ban_duration: "876000h", // 100 years
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Lift ban
    const { error } = await db.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/clients?id=xxx
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = adminClient();
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
