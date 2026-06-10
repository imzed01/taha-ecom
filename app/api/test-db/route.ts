import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    await dbConnect();

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
