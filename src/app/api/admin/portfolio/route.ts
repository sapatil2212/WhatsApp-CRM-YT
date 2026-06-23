import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function isAuthorized(): Promise<boolean> {
  // Check Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return true;
  } catch (err) {}

  // Check Super Admin Cookie
  try {
    const cookieStore = await cookies();
    return cookieStore.get("admin_session")?.value === "authenticated";
  } catch (err) {
    return false;
  }
}

function getDatabaseClient() {
  // Use service role key to manage portfolio items directly
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/portfolio - Get all showcase items
export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabaseClient();
    const { data, error } = await db
      .from("portfolio_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist, we send a specific hint so frontend falls back to localStorage
      if (error.code === "P0001" || error.message.includes("does not exist")) {
        return NextResponse.json({
          items: [],
          db_fallback: true,
          message: "portfolio_items table does not exist. Using local storage fallback."
        });
      }
      throw error;
    }

    return NextResponse.json({ items: data ?? [], db_fallback: false });
  } catch (error: any) {
    console.error("GET portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch items" }, { status: 500 });
  }
}

// POST /api/admin/portfolio - Create a new showcase item
export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, thumbnail_url, metadata_tags, project_links, preview_media } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const db = getDatabaseClient();
    const { data, error } = await db
      .from("portfolio_items")
      .insert({
        title,
        description: description || null,
        thumbnail_url: thumbnail_url || null,
        metadata_tags: metadata_tags || [],
        project_links: project_links || {},
        preview_media: preview_media || []
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("does not exist")) {
        return NextResponse.json({
          db_fallback: true,
          message: "portfolio_items table does not exist. Using local storage fallback."
        });
      }
      throw error;
    }

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error("POST portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to create item" }, { status: 500 });
  }
}

// PUT /api/admin/portfolio - Update an existing showcase item
export async function PUT(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, description, thumbnail_url, metadata_tags, project_links, preview_media } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "ID and Title are required" }, { status: 400 });
    }

    const db = getDatabaseClient();
    const { data, error } = await db
      .from("portfolio_items")
      .update({
        title,
        description: description || null,
        thumbnail_url: thumbnail_url || null,
        metadata_tags: metadata_tags || [],
        project_links: project_links || {},
        preview_media: preview_media || [],
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.message.includes("does not exist")) {
        return NextResponse.json({
          db_fallback: true,
          message: "portfolio_items table does not exist. Using local storage fallback."
        });
      }
      throw error;
    }

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error("PUT portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/admin/portfolio - Delete a showcase item
export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    const db = getDatabaseClient();
    const { error } = await db
      .from("portfolio_items")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.message.includes("does not exist")) {
        return NextResponse.json({
          db_fallback: true,
          message: "portfolio_items table does not exist."
        });
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete item" }, { status: 500 });
  }
}
