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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const slot = formData.get("slot") as string | null;

  if (!file || !slot) return NextResponse.json({ error: "Missing file or slot." }, { status: 400 });

  const ext  = file.name.split(".").pop();
  const path = `${session.user.id}/${slot}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("kyc-documents")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage
    .from("kyc-documents")
    .getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
