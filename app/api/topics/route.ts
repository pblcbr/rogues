import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * POST /api/topics
 * Create a new topic
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { workspaceId, name, regionId } = body;

    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: "workspaceId and name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("topics")
      .insert({
        workspace_id: workspaceId,
        workspace_region_id: regionId,
        name,
        is_selected: true,
        source: "custom",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, topic: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/topics
 * Update an existing topic
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { topicId, name, is_selected } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    const updateData: Partial<{
      name: string;
      is_selected: boolean;
    }> = {};
    if (name !== undefined) updateData.name = name;
    if (is_selected !== undefined) updateData.is_selected = is_selected;

    const { data, error } = await supabase
      .from("topics")
      .update(updateData)
      .eq("id", topicId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If topic is being deactivated, deactivate all associated prompts
    if (is_selected === false) {
      const { error: promptsError } = await supabase
        .from("monitoring_prompts")
        .update({ is_active: false })
        .eq("topic_id", topicId);

      if (promptsError) {
        console.error("Error deactivating prompts:", promptsError);
        // Don't fail the request, just log the error
        // The topic was already updated successfully
      }
    }

    return NextResponse.json({ success: true, topic: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/topics
 * Delete a topic
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("topics").delete().eq("id", topicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
