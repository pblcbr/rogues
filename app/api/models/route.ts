import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("models")
      .select("id, name, provider, version");
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ models: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
