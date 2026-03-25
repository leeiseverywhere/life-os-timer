import { auth } from "@/lib/auth";
import { createManualRecord } from "@/lib/calendar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { title, startTime, endTime, category, originalEventId } = await request.json();
    if (!title || !startTime || !endTime || !category) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const event = await createManualRecord(
      session.accessToken, title, startTime, endTime, category, originalEventId,
    );
    return NextResponse.json(event);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed", detail: msg }, { status: 500 });
  }
}
