import { NextRequest } from "next/server";
import { error, json, withVerified } from "@/lib/api";

type KlipyFile = {
  gif?: { url?: string };
  webp?: { url?: string };
};

type KlipyItem = {
  id: string | number;
  title?: string;
  file?: {
    hd?: KlipyFile;
    md?: KlipyFile;
    sm?: KlipyFile;
    xs?: KlipyFile;
  };
};

export async function GET(req: NextRequest) {
  const { user, response } = await withVerified();
  if (!user) return response;

  const key = process.env.KLIPY_API_KEY || process.env.GIPHY_API_KEY;
  if (!key) {
    return json({ gifs: [], configured: false });
  }

  const q = req.nextUrl.searchParams.get("q") || "hello";
  const url = new URL(`https://api.klipy.com/api/v1/${key}/gifs/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "24");

  const res = await fetch(url.toString());
  if (!res.ok) return error("GIF search failed", 502);
  const payload = (await res.json()) as {
    result?: boolean;
    data?: { data?: KlipyItem[] };
  };
  const items = payload.data?.data || [];

  return json({
    configured: true,
    gifs: items
      .map((g) => {
        const preview =
          g.file?.xs?.webp?.url ||
          g.file?.xs?.gif?.url ||
          g.file?.sm?.gif?.url ||
          "";
        const original =
          g.file?.md?.gif?.url ||
          g.file?.hd?.gif?.url ||
          g.file?.sm?.gif?.url ||
          "";
        return {
          id: String(g.id),
          title: g.title || "",
          preview,
          url: original,
        };
      })
      .filter((g) => g.preview && g.url),
  });
}
