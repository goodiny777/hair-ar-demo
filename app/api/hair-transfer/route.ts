import { NextRequest, NextResponse } from "next/server";
import { generateHairstyle } from "@/lib/replicate-client";

// Allow Vercel to hold the request open for cold-start + generation.
export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  image?: string;
  haircut?: string;
  hair_color?: string;
  gender?: "none" | "male" | "female";
};

export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not configured on the server." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { image, haircut, hair_color, gender } = body;
  if (!image || !haircut || !hair_color) {
    return NextResponse.json(
      { error: "Missing required fields: image, haircut, hair_color." },
      { status: 400 },
    );
  }

  try {
    const result = await generateHairstyle({
      image,
      haircut,
      hair_color,
      gender,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[hair-transfer] generation failed:", err);
    const upstreamStatus = (err as { response?: { status?: number } })?.response?.status;
    if (upstreamStatus === 402) {
      return NextResponse.json(
        {
          error:
            "На Replicate-аккаунте закончился баланс. Пополните его на https://replicate.com/account/billing",
        },
        { status: 402 },
      );
    }
    if (upstreamStatus === 401) {
      return NextResponse.json(
        { error: "Replicate token is invalid or revoked." },
        { status: 401 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
