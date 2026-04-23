import type { FaceShape } from "./face-shape";

// These strings MUST match the FLUX `haircut` enum exactly.
// Source: GET /v1/models/flux-kontext-apps/change-haircut → latest_version.openapi_schema.components.schemas.haircut.enum
export type FluxHaircut =
  | "Bob"
  | "Pixie Cut"
  | "Layered"
  | "Wavy"
  | "Curly"
  | "Straight"
  | "Long Ponytail"
  | "Side-Swept Bangs"
  | "Blunt Bangs"
  | "Asymmetrical Bob"
  | "A-Line Bob"
  | "Angled Bob"
  | "Shag"
  | "Lob"
  | "Soft Waves"
  | "Glamorous Waves"
  | "Tousled"
  | "Undercut"
  | "Slicked Back"
  | "Side-Parted";

// FLUX `hair_color` enum (subset we expose).
export type FluxColor =
  | "Blonde"
  | "Platinum Blonde"
  | "Honey Blonde"
  | "Brunette"
  | "Dark Brown"
  | "Light Brown"
  | "Auburn"
  | "Copper"
  | "Red"
  | "Black"
  | "Silver"
  | "Rose Gold";

export type StylePreset = {
  id: string;
  title: string;
  description: string;
  haircut: FluxHaircut;
  defaultColor: FluxColor;
};

export const COLOR_PALETTE_RU: Array<{ color: FluxColor; label: string; swatch: string }> = [
  { color: "Blonde", label: "Блонд", swatch: "#D4B27C" },
  { color: "Platinum Blonde", label: "Платиновый блонд", swatch: "#E8E4DE" },
  { color: "Honey Blonde", label: "Медовый блонд", swatch: "#C9A66B" },
  { color: "Light Brown", label: "Светло-русый", swatch: "#8C6239" },
  { color: "Brunette", label: "Тёмный шатен", swatch: "#3B2314" },
  { color: "Dark Brown", label: "Тёмно-каштановый", swatch: "#2B1810" },
  { color: "Auburn", label: "Каштановый", swatch: "#A52A2A" },
  { color: "Copper", label: "Медный", swatch: "#B87333" },
  { color: "Red", label: "Рыжий", swatch: "#C62828" },
  { color: "Black", label: "Чёрный", swatch: "#1A1A1A" },
  { color: "Silver", label: "Серебристый", swatch: "#B8B8B8" },
  { color: "Rose Gold", label: "Розовое золото", swatch: "#D8A09C" },
];

export const STYLE_PRESETS: Record<string, StylePreset> = {
  bob_classic: {
    id: "bob_classic",
    title: "Классическое каре",
    description: "Длина до подбородка, прямой срез.",
    haircut: "Bob",
    defaultColor: "Brunette",
  },
  bob_aline: {
    id: "bob_aline",
    title: "A-line каре",
    description: "Удлинение к лицу, задняя часть короче.",
    haircut: "A-Line Bob",
    defaultColor: "Dark Brown",
  },
  bob_asymmetric: {
    id: "bob_asymmetric",
    title: "Асимметричное каре",
    description: "Разная длина по сторонам, современный акцент.",
    haircut: "Asymmetrical Bob",
    defaultColor: "Auburn",
  },
  lob: {
    id: "lob",
    title: "Lob (длинное каре)",
    description: "Чуть ниже плеч, универсальная длина.",
    haircut: "Lob",
    defaultColor: "Honey Blonde",
  },
  long_wavy: {
    id: "long_wavy",
    title: "Длинные волны",
    description: "Мягкие локоны, длина до лопаток.",
    haircut: "Wavy",
    defaultColor: "Light Brown",
  },
  soft_waves: {
    id: "soft_waves",
    title: "Лёгкие волны",
    description: "Умеренные волны, добавляют объёма.",
    haircut: "Soft Waves",
    defaultColor: "Blonde",
  },
  layered_long: {
    id: "layered_long",
    title: "Длинные слои",
    description: "Каскад, добавляет текстуру и объём.",
    haircut: "Layered",
    defaultColor: "Brunette",
  },
  curly: {
    id: "curly",
    title: "Кудри",
    description: "Плотные завитки, заметный объём по бокам.",
    haircut: "Curly",
    defaultColor: "Auburn",
  },
  pixie: {
    id: "pixie",
    title: "Пикси",
    description: "Короткая стрижка, открывает лицо.",
    haircut: "Pixie Cut",
    defaultColor: "Platinum Blonde",
  },
  shag: {
    id: "shag",
    title: "Шэг",
    description: "Рваные слои, растрёпанная текстура.",
    haircut: "Shag",
    defaultColor: "Copper",
  },
  side_bangs: {
    id: "side_bangs",
    title: "Косая чёлка",
    description: "Чёлка набок, мягко обрамляет лицо.",
    haircut: "Side-Swept Bangs",
    defaultColor: "Dark Brown",
  },
  blunt_bangs: {
    id: "blunt_bangs",
    title: "Прямая чёлка",
    description: "Ровная линия, графичный силуэт.",
    haircut: "Blunt Bangs",
    defaultColor: "Black",
  },
  slicked_back: {
    id: "slicked_back",
    title: "Зализанные назад",
    description: "Открытый лоб, строгая эстетика.",
    haircut: "Slicked Back",
    defaultColor: "Black",
  },
  undercut: {
    id: "undercut",
    title: "Андеркат",
    description: "Выбритые виски, длинный верх.",
    haircut: "Undercut",
    defaultColor: "Dark Brown",
  },
  straight_long: {
    id: "straight_long",
    title: "Длинные прямые",
    description: "Гладкие, ровные, без объёма.",
    haircut: "Straight",
    defaultColor: "Brunette",
  },
};

const RECOMMENDATIONS: Record<FaceShape, string[]> = {
  oval: ["lob", "long_wavy", "layered_long", "pixie", "bob_classic", "shag"],
  round: ["long_wavy", "layered_long", "bob_asymmetric", "side_bangs", "lob"],
  square: ["long_wavy", "side_bangs", "soft_waves", "lob", "layered_long"],
  heart: ["bob_classic", "lob", "side_bangs", "soft_waves", "layered_long"],
  oblong: ["bob_classic", "curly", "blunt_bangs", "shag", "soft_waves"],
  diamond: ["bob_classic", "side_bangs", "lob", "shag", "soft_waves"],
};

export function getRecommendations(shape: FaceShape): StylePreset[] {
  return RECOMMENDATIONS[shape]
    .map((id) => STYLE_PRESETS[id])
    .filter((s): s is StylePreset => Boolean(s));
}
