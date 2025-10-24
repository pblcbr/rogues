import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/client";

/**
 * GET /api/auth/debug-user?email=user@example.com
 * Debug endpoint to check user status in Supabase
 * This endpoint uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get user by email using admin API
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Find user with matching email
    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: "User does not exist. You can proceed with registration.",
      });
    }

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        isConfirmed: !!user.email_confirmed_at,
      },
      message: user.email_confirmed_at
        ? "User exists and email is verified"
        : "User exists but email is NOT verified",
    });
  } catch (error) {
    console.error("Debug user error:", error);
    return NextResponse.json(
      { error: "Failed to check user status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/debug-user?email=user@example.com
 * Delete unverified user to allow re-registration
 * Only deletes if email is not confirmed
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get user by email
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Error fetching users:", listError);
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: "User does not exist" },
        { status: 404 }
      );
    }

    // Only allow deletion if email is not confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json(
        {
          error:
            "Cannot delete verified user. Please use account deletion from dashboard.",
        },
        { status: 403 }
      );
    }

    // Delete user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message:
        "Unverified user deleted successfully. You can now register again.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
