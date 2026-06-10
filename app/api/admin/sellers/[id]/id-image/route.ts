import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const seller = await User.findById(id).select(
      "idImageFront idImageBack role"
    );

    if (!seller || seller.role !== "seller") {
      return NextResponse.json(
        { message: "Seller not found" },
        { status: 404 }
      );
    }

    if (!seller.idImageFront || !seller.idImageBack) {
      return NextResponse.json(
        { message: "ID images not found" },
        { status: 404 }
      );
    }

    // Add caching headers
    const response = NextResponse.json({
      idImageFront: seller.idImageFront,
      idImageBack: seller.idImageBack,
    });

    // Cache for 1 hour
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600"
    );
    response.headers.set("ETag", `"${id}-${seller.updatedAt?.getTime()}"`);

    return response;
  } catch (error) {
    console.error("Error fetching seller ID image:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
