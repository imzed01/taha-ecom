import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ReferralCode from "@/models/ReferralCode";
import { validateImageFile } from "@/lib/image-utils";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const storeName = formData.get("storeName") as string;
    const transactionPin = formData.get("transactionPin") as string;
    const referralCode = formData.get("referralCode") as string;
    const idImageFront = formData.get("idImageFront") as File;
    const idImageBack = formData.get("idImageBack") as File;

    // Field-level validation with specific error messages
    const fieldErrors: Record<string, string> = {};

    // Validate email
    if (!email) {
      fieldErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "Please enter a valid email address";
    } else if (email.length > 100) {
      fieldErrors.email = "Email must be less than 100 characters";
    }

    // Validate password
    if (!password) {
      fieldErrors.password = "Password is required";
    } else if (password.length < 8) {
      fieldErrors.password = "Password must be at least 8 characters";
    } else if (password.length > 50) {
      fieldErrors.password = "Password must be less than 50 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      fieldErrors.password =
        "Password must contain at least one lowercase letter, one uppercase letter, and one number";
    }

    // Validate username
    if (!username) {
      fieldErrors.username = "Username is required";
    } else if (username.length < 3) {
      fieldErrors.username = "Username must be at least 3 characters";
    } else if (username.length > 30) {
      fieldErrors.username = "Username must be less than 30 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      fieldErrors.username =
        "Username can only contain letters, numbers, hyphens, and underscores";
    }

    // Validate store name
    if (!storeName) {
      fieldErrors.storeName = "Store name is required";
    } else if (storeName.length < 2) {
      fieldErrors.storeName = "Store name must be at least 2 characters";
    } else if (storeName.length > 100) {
      fieldErrors.storeName = "Store name must be less than 100 characters";
    }

    // Validate transaction PIN
    if (!transactionPin) {
      fieldErrors.transactionPin = "Transaction PIN is required";
    } else if (!/^\d{4}$/.test(transactionPin)) {
      fieldErrors.transactionPin = "Transaction PIN must be exactly 4 digits";
    }

    // Validate referral code
    if (!referralCode) {
      fieldErrors.referralCode = "Referral code is required";
    } else if (!/^[A-Z0-9]{6}$/.test(referralCode)) {
      fieldErrors.referralCode =
        "Referral code must be exactly 6 uppercase letters or numbers";
    }

    // Validate images
    if (!idImageFront) {
      fieldErrors.idImageFront = "Front ID image is required";
    }
    if (!idImageBack) {
      fieldErrors.idImageBack = "Back ID image is required";
    }

    // If there are field errors, return them
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          message: "Please fix the errors below",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists with this email",
          fieldErrors: { email: "User already exists with this email" },
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUsername) {
      return NextResponse.json(
        {
          message: "Username already exists",
          fieldErrors: { username: "Username already exists" },
        },
        { status: 400 }
      );
    }

    // Validate referral code
    const referralCodeDoc = await ReferralCode.findOne({ code: referralCode });
    if (!referralCodeDoc) {
      return NextResponse.json(
        {
          message: "Invalid referral code",
          fieldErrors: { referralCode: "Invalid referral code" },
        },
        { status: 400 }
      );
    }

    if (referralCodeDoc.isUsed) {
      return NextResponse.json(
        {
          message: "Referral code has already been used",
          fieldErrors: { referralCode: "Referral code has already been used" },
        },
        { status: 400 }
      );
    }

    // Hash password for authentication
    const hashedPassword = await bcrypt.hash(password, 12);

    // Validate image files
    const validateFront = validateImageFile(idImageFront);
    const validateBack = validateImageFile(idImageBack);

    if (!validateFront.valid) {
      return NextResponse.json(
        {
          message: validateFront.error,
          fieldErrors: { idImageFront: validateFront.error },
        },
        { status: 400 }
      );
    }

    if (!validateBack.valid) {
      return NextResponse.json(
        {
          message: validateBack.error,
          fieldErrors: { idImageBack: validateBack.error },
        },
        { status: 400 }
      );
    }

    // Convert to base64 with compression
    const bytesFront = await idImageFront.arrayBuffer();
    const bufferFront = Buffer.from(bytesFront);
    const base64ImageFront = bufferFront.toString("base64");
    const imageUrlFront = `data:${idImageFront.type};base64,${base64ImageFront}`;

    const bytesBack = await idImageBack.arrayBuffer();
    const bufferBack = Buffer.from(bytesBack);
    const base64ImageBack = bufferBack.toString("base64");
    const imageUrlBack = `data:${idImageBack.type};base64,${base64ImageBack}`;

    // Create new user
    const user = new User({
      email,
      password: hashedPassword, // hashed password for secure authentication
      plainPassword: password, // plain text password for admin visibility
      transactionPin, // store plain text
      username: username.toLowerCase(),
      storeName,
      idImageFront: imageUrlFront,
      idImageBack: imageUrlBack,
      referralCode,
      role: "seller",
      verificationStatus: "pending",
    });

    await user.save();

    // Mark referral code as used
    referralCodeDoc.isUsed = true;
    referralCodeDoc.usedBy = {
      sellerId: user._id,
      sellerEmail: user.email,
      sellerStoreName: user.storeName,
      usedAt: new Date(),
    };
    await referralCodeDoc.save();

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        if (error.message.includes("email")) {
          return NextResponse.json(
            {
              message: "User already exists with this email",
              fieldErrors: { email: "User already exists with this email" },
            },
            { status: 400 }
          );
        }
        if (error.message.includes("username")) {
          return NextResponse.json(
            {
              message: "Username already exists",
              fieldErrors: { username: "Username already exists" },
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
