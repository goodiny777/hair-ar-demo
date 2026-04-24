import Replicate from "replicate";

const token = process.env.REPLICATE_API_TOKEN;
if (!token && process.env.NODE_ENV !== "production") {
  console.warn("[replicate-client] REPLICATE_API_TOKEN is not set; API calls will fail.");
}

const replicate = new Replicate({ auth: token });

// Pinned version IDs. Refresh via:
//   curl -s -H "Authorization: Token $REPLICATE_API_TOKEN" \
//     https://api.replicate.com/v1/models/<owner>/<name> | jq -r '.latest_version.id'
const MODELS = {
  flux: "flux-kontext-apps/change-haircut:e30b995ea7834dd440ee987205fffe1841ce28c638f2ec8d599972e904fe69f8",
  hairclip: "wty-ustc/hairclip:b95cb2a16763bea87ed7ed851d5a3ab2f4655e94bcfb871edba029d4814fa587",
} as const;

export type HairTransferInput = {
  /** JPEG/PNG data URI or HTTPS URL. */
  image: string;
  /** FLUX haircut enum value, e.g. "Bob". */
  haircut: string;
  /** FLUX hair_color enum value, e.g. "Blonde". Use "No change" to keep color. */
  hair_color: string;
  /** Optional gender hint. */
  gender?: "none" | "male" | "female";
};

export type HairTransferResult = {
  imageUrl: string;
  model: "flux" | "hairclip";
};

function firstUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  // Replicate SDK may return a FileOutput with .url()
  if (output && typeof output === "object" && "url" in output) {
    const maybeUrl = (output as { url: unknown }).url;
    if (typeof maybeUrl === "string") return maybeUrl;
    if (typeof maybeUrl === "function") {
      const v = (maybeUrl as () => unknown)();
      if (v && typeof (v as URL).toString === "function") return (v as URL).toString();
    }
  }
  throw new Error(`Unexpected Replicate output shape: ${JSON.stringify(output).slice(0, 200)}`);
}

async function runFlux(input: HairTransferInput): Promise<HairTransferResult> {
  const output = await replicate.run(MODELS.flux, {
    input: {
      input_image: input.image,
      haircut: input.haircut,
      hair_color: input.hair_color,
      gender: input.gender ?? "none",
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      safety_tolerance: 2,
    },
  });
  return { imageUrl: firstUrl(output), model: "flux" };
}

// Crude mapping from FLUX haircut labels to HairCLIP's enum values.
// HairCLIP's enum is coarser than FLUX's; we just pick the nearest concept.
const HAIRCLIP_STYLE_MAP: Record<string, string> = {
  Bob: "bob cut hairstyle",
  "A-Line Bob": "bob cut hairstyle",
  "Asymmetrical Bob": "bob cut hairstyle",
  Lob: "bob cut hairstyle",
  "Pixie Cut": "pixie cut hairstyle",
  Curly: "ringlets hairstyle",
  Wavy: "finger waves hairstyle",
  "Soft Waves": "finger waves hairstyle",
  "Glamorous Waves": "finger waves hairstyle",
  Layered: "short hair hairstyle",
  Shag: "short hair hairstyle",
  Straight: "short hair hairstyle",
  "Side-Swept Bangs": "curtained hair hairstyle",
  "Blunt Bangs": "bowl cut hairstyle",
  "Slicked Back": "slicked-back hairstyle",
  Undercut: "undercut hairstyle",
  "Side-Parted": "slicked-back hairstyle",
  Tousled: "surfer hair hairstyle",
  "Long Ponytail": "short hair hairstyle",
};

function mapStyleToHairClip(haircut: string): string {
  return HAIRCLIP_STYLE_MAP[haircut] ?? "bob cut hairstyle";
}

function colorToFreeText(color: string): string {
  if (!color || color === "No change") return "";
  return color.toLowerCase();
}

async function runHairClip(input: HairTransferInput): Promise<HairTransferResult> {
  const hasColor = input.hair_color && input.hair_color !== "No change";
  const editingType = hasColor ? "both" : "hairstyle";
  const output = await replicate.run(MODELS.hairclip, {
    input: {
      image: input.image,
      editing_type: editingType,
      hairstyle_description: mapStyleToHairClip(input.haircut),
      color_description: colorToFreeText(input.hair_color),
    },
  });
  return { imageUrl: firstUrl(output), model: "hairclip" };
}

function isAccountLevelError(err: unknown): boolean {
  // 401 invalid token, 402 out of credit, 403 forbidden — all apply to every
  // model on the account, so the fallback cannot help.
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 402 || status === 403;
}

/**
 * Generate the hair-transfer preview. Tries FLUX first (best quality),
 * falls back to HairCLIP on failure (cheaper, less accurate). Skips the
 * fallback on account-level errors where both models would fail identically.
 */
export async function generateHairstyle(input: HairTransferInput): Promise<HairTransferResult> {
  try {
    return await runFlux(input);
  } catch (err) {
    if (isAccountLevelError(err)) throw err;
    console.warn("[replicate] FLUX failed, falling back to HairCLIP:", err);
    return await runHairClip(input);
  }
}
