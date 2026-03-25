import { auth } from "@/lib/auth";
import { updateEventCategory } from "@/lib/calendar";
import { NextRequest, NextResponse } from "next/server";
import { CategoryId } from "@/lib/calendar-types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { eventId, category } = await request.json();
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    await updateEventCategory(session.accessToken, eventId, category as CategoryId | null);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed", detail: msg }, { status: 500 });
  }
}
