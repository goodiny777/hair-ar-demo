import type { FaceShape } from "./face-shape";
import type { Gender } from "./gender-detection";

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
  | "Side-Parted"
  | "Center-Parted"
  | "Crew Cut"
  | "Faux Hawk"
  | "Razor Cut"
  | "Mohawk Fade";

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

export type StyleGender = "male" | "female" | "unisex";

export type StylePreset = {
  id: string;
  title: string;
  description: string;
  haircut: FluxHaircut;
  defaultColor: FluxColor;
  gender: StyleGender;
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
  // ── Female ────────────────────────────────────────────────────────────
  bob_classic: {
    id: "bob_classic",
    title: "Классическое каре",
    description: "Длина до подбородка, прямой срез.",
    haircut: "Bob",
    defaultColor: "Brunette",
    gender: "female",
  },
  bob_aline: {
    id: "bob_aline",
    title: "A-line каре",
    description: "Удлинение к лицу, задняя часть короче.",
    haircut: "A-Line Bob",
    defaultColor: "Dark Brown",
    gender: "female",
  },
  bob_asymmetric: {
    id: "bob_asymmetric",
    title: "Асимметричное каре",
    description: "Разная длина по сторонам, современный акцент.",
    haircut: "Asymmetrical Bob",
    defaultColor: "Auburn",
    gender: "female",
  },
  lob: {
    id: "lob",
    title: "Lob (длинное каре)",
    description: "Чуть ниже плеч, универсальная длина.",
    haircut: "Lob",
    defaultColor: "Honey Blonde",
    gender: "female",
  },
  long_wavy: {
    id: "long_wavy",
    title: "Длинные волны",
    description: "Мягкие локоны, длина до лопаток.",
    haircut: "Wavy",
    defaultColor: "Light Brown",
    gender: "female",
  },
  soft_waves: {
    id: "soft_waves",
    title: "Лёгкие волны",
    description: "Умеренные волны, добавляют объёма.",
    haircut: "Soft Waves",
    defaultColor: "Blonde",
    gender: "female",
  },
  layered_long: {
    id: "layered_long",
    title: "Длинные слои",
    description: "Каскад, добавляет текстуру и объём.",
    haircut: "Layered",
    defaultColor: "Brunette",
    gender: "female",
  },
  curly: {
    id: "curly",
    title: "Кудри",
    description: "Плотные завитки, заметный объём по бокам.",
    haircut: "Curly",
    defaultColor: "Auburn",
    gender: "female",
  },
  pixie: {
    id: "pixie",
    title: "Пикси",
    description: "Короткая стрижка, открывает лицо.",
    haircut: "Pixie Cut",
    defaultColor: "Platinum Blonde",
    gender: "female",
  },
  shag: {
    id: "shag",
    title: "Шэг",
    description: "Рваные слои, растрёпанная текстура.",
    haircut: "Shag",
    defaultColor: "Copper",
    gender: "female",
  },
  side_bangs: {
    id: "side_bangs",
    title: "Косая чёлка",
    description: "Чёлка набок, мягко обрамляет лицо.",
    haircut: "Side-Swept Bangs",
    defaultColor: "Dark Brown",
    gender: "female",
  },
  blunt_bangs: {
    id: "blunt_bangs",
    title: "Прямая чёлка",
    description: "Ровная линия, графичный силуэт.",
    haircut: "Blunt Bangs",
    defaultColor: "Black",
    gender: "female",
  },
  straight_long: {
    id: "straight_long",
    title: "Длинные прямые",
    description: "Гладкие, ровные, без объёма.",
    haircut: "Straight",
    defaultColor: "Brunette",
    gender: "female",
  },

  // ── Male ─────────────────────────────────────────────────────────────
  m_crew_cut: {
    id: "m_crew_cut",
    title: "Crew Cut",
    description: "Классическая короткая стрижка, ровная длина.",
    haircut: "Crew Cut",
    defaultColor: "Dark Brown",
    gender: "male",
  },
  m_side_parted: {
    id: "m_side_parted",
    title: "Пробор на бок",
    description: "Деловой вариант, чистые линии.",
    haircut: "Side-Parted",
    defaultColor: "Dark Brown",
    gender: "male",
  },
  m_undercut: {
    id: "m_undercut",
    title: "Андеркат",
    description: "Короткие виски, длинный верх.",
    haircut: "Undercut",
    defaultColor: "Black",
    gender: "male",
  },
  m_slicked_back: {
    id: "m_slicked_back",
    title: "Зализанные назад",
    description: "Открытый лоб, строгая эстетика.",
    haircut: "Slicked Back",
    defaultColor: "Black",
    gender: "male",
  },
  m_faux_hawk: {
    id: "m_faux_hawk",
    title: "Faux Hawk",
    description: "Приподнятая полоса по центру, боковые виски короче.",
    haircut: "Faux Hawk",
    defaultColor: "Dark Brown",
    gender: "male",
  },
  m_razor_cut: {
    id: "m_razor_cut",
    title: "Razor Cut",
    description: "Текстурная стрижка бритвой, рваная длина.",
    haircut: "Razor Cut",
    defaultColor: "Brunette",
    gender: "male",
  },
  m_mohawk_fade: {
    id: "m_mohawk_fade",
    title: "Mohawk Fade",
    description: "Ирокез с плавным переходом. Смелый вариант.",
    haircut: "Mohawk Fade",
    defaultColor: "Black",
    gender: "male",
  },
  m_center_parted: {
    id: "m_center_parted",
    title: "Центральный пробор",
    description: "Длина средняя, ровный пробор по центру.",
    haircut: "Center-Parted",
    defaultColor: "Brunette",
    gender: "male",
  },

  // ── Unisex ───────────────────────────────────────────────────────────
  u_wavy: {
    id: "u_wavy",
    title: "Волны",
    description: "Естественные волны средней длины.",
    haircut: "Wavy",
    defaultColor: "Light Brown",
    gender: "unisex",
  },
  u_tousled: {
    id: "u_tousled",
    title: "Растрёпанные",
    description: "Естественная укладка с объёмом.",
    haircut: "Tousled",
    defaultColor: "Light Brown",
    gender: "unisex",
  },
};

const RECOMMENDATIONS_FEMALE: Record<FaceShape, string[]> = {
  oval: ["lob", "long_wavy", "layered_long", "pixie", "bob_classic", "shag"],
  round: ["long_wavy", "layered_long", "bob_asymmetric", "side_bangs", "lob"],
  square: ["long_wavy", "side_bangs", "soft_waves", "lob", "layered_long"],
  heart: ["bob_classic", "lob", "side_bangs", "soft_waves", "layered_long"],
  oblong: ["bob_classic", "curly", "blunt_bangs", "shag", "soft_waves"],
  diamond: ["bob_classic", "side_bangs", "lob", "shag", "soft_waves"],
};

const RECOMMENDATIONS_MALE: Record<FaceShape, string[]> = {
  oval: ["m_crew_cut", "m_side_parted", "m_undercut", "m_slicked_back", "u_wavy", "m_razor_cut"],
  round: ["m_faux_hawk", "m_undercut", "m_side_parted", "m_slicked_back", "m_mohawk_fade"],
  square: ["m_crew_cut", "m_side_parted", "m_slicked_back", "u_wavy", "m_center_parted"],
  heart: ["m_side_parted", "m_slicked_back", "m_crew_cut", "m_razor_cut", "u_tousled"],
  oblong: ["m_crew_cut", "m_razor_cut", "u_wavy", "u_tousled", "m_center_parted"],
  diamond: ["m_side_parted", "m_crew_cut", "m_razor_cut", "u_wavy", "m_slicked_back"],
};

export function getRecommendations(shape: FaceShape, gender: Gender): StylePreset[] {
  const ids = gender === "male" ? RECOMMENDATIONS_MALE[shape] : RECOMMENDATIONS_FEMALE[shape];
  return ids.map((id) => STYLE_PRESETS[id]).filter((s): s is StylePreset => Boolean(s));
}
