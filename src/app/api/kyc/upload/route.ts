import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slot = formData.get("slot") as string | null;

    if (!file || !slot) return NextResponse.json({ error: "Missing file or slot." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `kyc-documents/${session.user.id}`,
      public_id: `${slot}-${Date.now()}`,
      resource_type: "auto",
    });

    return NextResponse.json({ url: result.secure_url });

  } catch (e: any) {
    console.log("[kyc/upload] error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
