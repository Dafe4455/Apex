import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slot = formData.get("slot") as string | null;

    if (!file || !slot) return NextResponse.json({ error: "Missing file or slot." }, { status: 400 });

    const ext  = file.name.split(".").pop();
    const path = `${session.user.id}/${slot}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log("[kyc/upload] bucket: kyc-documents");
    console.log("[kyc/upload] path:", path);
    console.log("[kyc/upload] size:", buffer.length);
    console.log("[kyc/upload] supabase url:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[kyc/upload] service key set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabaseAdmin.storage
      .from("kyc-documents")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      console.log("[kyc/upload] supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage
      .from("kyc-documents")
      .getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });

  } catch (e: any) {
    console.log("[kyc/upload] caught:", e.message);
    console.log("[kyc/upload] cause:", String(e.cause));
    return NextResponse.json({ error: e.message, cause: String(e.cause) }, { status: 500 });
  }
}
