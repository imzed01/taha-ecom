import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("Test API called");
  const { id } = await params;
  return NextResponse.json({
    message: "Test endpoint working",
    sellerId: id,
    timestamp: new Date().toISOString(),
  });
}
