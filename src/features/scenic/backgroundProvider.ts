import localManifest from "@/assets/scenic-manifest.json";

export type ScenicTheme = "light" | "dark" | "system";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface BackgroundQuery {
  country?: string;
  city?: string;
  theme: ScenicTheme;
  timeOfDay: TimeOfDay;
}

export interface BackgroundAttribution {
  provider: "local" | "cdn" | "third-party" | "default";
  text: string;
  link?: string;
}

export interface BackgroundResult {
  imageUrl: string;
  attribution: BackgroundAttribution;
  cacheTTL: number;
}

type ManifestEntry = BackgroundQuery & BackgroundResult;

interface ScenicManifest {
  default: BackgroundResult;
  entries: ManifestEntry[];
}

const manifest = localManifest as ScenicManifest;
const FETCH_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, timeoutMs = FETCH_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function normalize(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function pickLocal(query: BackgroundQuery): BackgroundResult | null {
  const match = manifest.entries.find((entry) => {
    return (
      normalize(entry.country) === normalize(query.country) &&
      normalize(entry.city) === normalize(query.city) &&
      entry.theme === query.theme &&
      entry.timeOfDay === query.timeOfDay
    );
  });

  return match || null;
}

async function pickCdn(query: BackgroundQuery): Promise<BackgroundResult | null> {
  const res = await withTimeout(fetch("/api/scenic/background-manifest"));
  if (!res.ok) return null;
  const data = (await res.json()) as { entries?: ManifestEntry[] };
  if (!Array.isArray(data.entries)) return null;

  const match = data.entries.find((entry) => {
    return (
      normalize(entry.country) === normalize(query.country) &&
      normalize(entry.city) === normalize(query.city) &&
      entry.theme === query.theme &&
      entry.timeOfDay === query.timeOfDay
    );
  });

  return match || null;
}

async function pickThirdParty(query: BackgroundQuery): Promise<BackgroundResult | null> {
  const token = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!token) return null;

  const q = encodeURIComponent([query.city, query.country, query.timeOfDay, "scenic"].filter(Boolean).join(" "));
  const url = `https://api.unsplash.com/photos/random?orientation=landscape&query=${q}&client_id=${token}`;

  const res = await withTimeout(fetch(url));
  if (!res.ok) return null;
  const data = await res.json() as any;
  if (!data?.urls?.full) return null;

  return {
    imageUrl: data.urls.full,
    attribution: {
      provider: "third-party",
      text: data.user?.name || "Unsplash",
      link: data.user?.links?.html ? `${data.user.links.html}?utm_source=hyperion&utm_medium=referral` : "https://unsplash.com"
    },
    cacheTTL: 1800
  };
}

function getDefaultBackground(): BackgroundResult {
  return manifest.default;
}

export async function resolveBackground(query: BackgroundQuery): Promise<BackgroundResult> {
  const local = pickLocal(query);
  if (local?.imageUrl) return local;

  try {
    const cdn = await pickCdn(query);
    if (cdn?.imageUrl) return { ...cdn, attribution: { ...cdn.attribution, provider: "cdn" } };
  } catch {}

  try {
    const thirdParty = await pickThirdParty(query);
    if (thirdParty?.imageUrl) return thirdParty;
  } catch {}

  return getDefaultBackground();
}
