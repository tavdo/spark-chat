import { NextRequest } from "next/server";
import { error, json, withVerified } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await withVerified();
  if (!user) return response;

  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return json({ gifs: [], configured: false });
  }

  const q = req.nextUrl.searchParams.get("q") || "hello";
  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "24");
  url.searchParams.set("rating", "pg-13");

  const res = await fetch(url.toString());
  if (!res.ok) return error("GIF search failed", 502);
  const data = (await res.json()) as {
    data: Array<{
      id: string;
      title: string;
      images: { fixed_height_small: { url: string }; original: { url: string } };
    }>;
  };

  return json({
    configured: true,
    gifs: data.data.map((g) => ({
      id: g.id,
      title: g.title,
      preview: g.images.fixed_height_small.url,
      url: g.images.original.url,
    })),
  });
}
