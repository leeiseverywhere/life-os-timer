import { auth } from "@/lib/auth";
import { createCompletionEvent } from "@/lib/calendar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, startTime, endTime, category, originalEventId } = body;

    if (!title || !startTime || !endTime || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await createCompletionEvent(
      session.accessToken,
      title,
      startTime,
      endTime,
      category,
      originalEventId,
    );

    return NextResponse.json(event);
  } catch (error: unknown) {
    console.error("Failed to create completion event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
