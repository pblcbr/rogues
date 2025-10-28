import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ competitors: [] });
  const { data, error } = await supabase
    .from("competitors")
    .select("id, name, domain, brand_terms")
    .eq("workspace_id", workspaceId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitors: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { workspaceId, name, domain, brandTerms } = body || {};
  if (!workspaceId || !name)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const { error } = await supabase
    .from("competitors")
    .insert({
      workspace_id: workspaceId,
      name,
      domain,
      brand_terms: brandTerms || [],
    });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
