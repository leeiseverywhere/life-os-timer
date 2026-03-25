import { auth } from "@/lib/auth";
import { getTodayEvents } from "@/lib/calendar";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await getTodayEvents(session.accessToken);
    return NextResponse.json(events);
  } catch (error: unknown) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
