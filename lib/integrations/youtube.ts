import "server-only";
import { getDB } from "@/lib/db/db";
import type { YoutubeVideo } from "@/lib/utils/types";

/**
 * جلب فيديوهات قناة يوتيوب.
 *
 * مساران:
 * • YouTube Data API v3 عند وجود YOUTUBE_API_KEY  → **كل الفيديوهات** (بالصفحات) + الإحصاءات.
 * • بلا مفتاح: تغذية RSS الرسمية للقناة → آخر ١٥ فيديو فقط، بلا أي إعداد.
 * لا شيء من هذا يحتاج صلاحيات على حساب المستخدم — القناة عامة.
 */

/** المفتاح: من متغيّرات البيئة أولاً، وإلا المحفوظ من لوحة الأدمن. */
function apiKey(): string {
  return process.env.YOUTUBE_API_KEY || getDB().integrations?.youtubeApiKey || "";
}
const API = "https://www.googleapis.com/youtube/v3";
const MAX_VIDEOS = 300; // سقف أمان لعدد الفيديوهات المجلوبة

export function youtubeApiConfigured(): boolean {
  return Boolean(apiKey());
}

/** استخراج معرّف القناة أو الاسم المعرِّف من أي صيغة يكتبها الأدمن. */
export function parseChannelInput(input: string): { channelId?: string; handle?: string } {
  const v = input.trim();
  const byId = v.match(/(UC[\w-]{20,})/);
  if (byId) return { channelId: byId[1] };
  const byHandle = v.match(/@([\w.\-؀-ۿ]+)/);
  if (byHandle) return { handle: `@${byHandle[1]}` };
  const byUser = v.match(/youtube\.com\/(?:c|user)\/([\w.\-]+)/i);
  if (byUser) return { handle: byUser[1] };
  return {};
}

/** تحويل الاسم المعرِّف (@handle) إلى معرّف قناة. */
export async function resolveChannelId(input: string): Promise<string | null> {
  const parsed = parseChannelInput(input);
  if (parsed.channelId) return parsed.channelId;

  // عبر الواجهة الرسمية إن توفّر المفتاح
  const KEY = apiKey();
  if (KEY && parsed.handle) {
    const url = `${API}/channels?part=id&forHandle=${encodeURIComponent(parsed.handle)}&key=${KEY}`;
    const r = await fetch(url, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    const id = r?.items?.[0]?.id;
    if (id) return id;
  }

  // بلا مفتاح: نقرأ معرّف القناة من صفحتها العامة (طلب واحد)
  const page = parsed.handle
    ? `https://www.youtube.com/${parsed.handle.startsWith("@") ? parsed.handle : "@" + parsed.handle}`
    : input.trim();
  try {
    const html = await fetch(page, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EmanZidanPlatform/1.0)" },
    }).then((r) => r.text());
    const m = html.match(/"channelId":"(UC[\w-]{20,})"/) || html.match(/channel\/(UC[\w-]{20,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

type ChannelInfo = {
  channelId: string;
  title?: string;
  thumbnail?: string;
  subscribers?: number;
  videoCount?: number;
  uploadsPlaylist?: string;
};

async function channelInfo(channelId: string): Promise<ChannelInfo> {
  const KEY = apiKey();
  if (!KEY) return { channelId };
  const url = `${API}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${KEY}`;
  const data = await fetch(url, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
  const it = data?.items?.[0];
  if (!it) return { channelId };
  return {
    channelId,
    title: it.snippet?.title,
    thumbnail: it.snippet?.thumbnails?.medium?.url ?? it.snippet?.thumbnails?.default?.url,
    subscribers: Number(it.statistics?.subscriberCount) || undefined,
    videoCount: Number(it.statistics?.videoCount) || undefined,
    uploadsPlaylist: it.contentDetails?.relatedPlaylists?.uploads,
  };
}

/** كل الفيديوهات عبر قائمة المرفوعات (بالصفحات). */
async function videosViaApi(playlistId: string): Promise<YoutubeVideo[]> {
  const KEY = apiKey();
  const out: YoutubeVideo[] = [];
  let pageToken = "";
  while (out.length < MAX_VIDEOS) {
    const url =
      `${API}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}` +
      `&key=${KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const data = await fetch(url, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    const items: unknown[] = data?.items ?? [];
    if (!items.length) break;

    for (const raw of items) {
      const it = raw as {
        snippet?: { title?: string; description?: string; thumbnails?: Record<string, { url?: string }> };
        contentDetails?: { videoId?: string; videoPublishedAt?: string };
      };
      const id = it.contentDetails?.videoId;
      if (!id) continue;
      out.push({
        id,
        title: it.snippet?.title ?? "",
        description: (it.snippet?.description ?? "").slice(0, 400),
        publishedAt: it.contentDetails?.videoPublishedAt,
        thumbnail:
          it.snippet?.thumbnails?.maxres?.url ??
          it.snippet?.thumbnails?.high?.url ??
          it.snippet?.thumbnails?.medium?.url ??
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      });
    }
    pageToken = data?.nextPageToken ?? "";
    if (!pageToken) break;
  }
  return out;
}

/** آخر ١٥ فيديو من تغذية RSS الرسمية (بلا مفتاح). */
async function videosViaRss(channelId: string): Promise<{ title?: string; videos: YoutubeVideo[] }> {
  const xml = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    cache: "no-store",
  }).then((r) => (r.ok ? r.text() : ""));
  if (!xml) return { videos: [] };

  const title = xml.match(/<title>([^<]+)<\/title>/)?.[1];
  const videos: YoutubeVideo[] = [];
  const entries = xml.split("<entry>").slice(1);
  for (const e of entries) {
    const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!id) continue;
    videos.push({
      id,
      title: (e.match(/<title>([^<]+)<\/title>/)?.[1] ?? "").replace(/&amp;/g, "&"),
      publishedAt: e.match(/<published>([^<]+)<\/published>/)?.[1],
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      description: (e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "").slice(0, 400),
      views: Number(e.match(/views="(\d+)"/)?.[1]) || undefined,
    });
  }
  return { title, videos };
}

export type SyncResult = {
  channelId: string;
  title?: string;
  thumbnail?: string;
  subscribers?: number;
  videoCount?: number;
  source: "api" | "rss";
  videos: YoutubeVideo[];
};

/** مزامنة كاملة لقناة. */
export async function syncChannel(input: string): Promise<SyncResult> {
  const channelId = await resolveChannelId(input);
  if (!channelId) throw new Error("تعذّر التعرّف على القناة — الصق رابط القناة كاملاً أو معرّفها UC…");

  const info = await channelInfo(channelId);
  if (apiKey() && info.uploadsPlaylist) {
    const videos = await videosViaApi(info.uploadsPlaylist);
    if (videos.length) {
      return { ...info, channelId, source: "api", videos };
    }
  }

  const rss = await videosViaRss(channelId);
  if (!rss.videos.length) throw new Error("لم يُعثر على فيديوهات — تأكّد أن القناة عامة");
  return {
    channelId,
    title: info.title ?? rss.title,
    thumbnail: info.thumbnail,
    subscribers: info.subscribers,
    videoCount: info.videoCount,
    source: "rss",
    videos: rss.videos,
  };
}
