export type VideoProvider = "youtube" | "rutube" | "vk";

export type NormalizedVideoUrl = {
  provider: VideoProvider;
  providerLabel: string;
  watchUrl: string;
  embedUrl: string;
};

const MAX_VIDEO_URL_LENGTH = 1000;
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const RUTUBE_VIDEO_ID = /^[a-f0-9]{32}$/i;
const VK_OWNER_ID = /^-?\d+$/;
const VK_VIDEO_ID = /^\d+$/;
const VK_ACCESS_HASH = /^[A-Za-z0-9_-]{6,128}$/;

const containsControlCharacter = (value: string) =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const hasAllowedConnectionDetails = (url: URL) =>
  url.protocol === "https:" &&
  url.username === "" &&
  url.password === "" &&
  (url.port === "" || url.port === "443");

const youtubeVideoId = (url: URL): string | null => {
  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    const match = url.pathname.match(/^\/([^/]+)\/?$/);
    return match && YOUTUBE_VIDEO_ID.test(match[1]) ? match[1] : null;
  }

  if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) return null;

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }

  const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/);
  return match && YOUTUBE_VIDEO_ID.test(match[1]) ? match[1] : null;
};

const normalizeYouTube = (url: URL): NormalizedVideoUrl | null => {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return {
    provider: "youtube",
    providerLabel: "YouTube",
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
  };
};

const normalizeRutube = (url: URL): NormalizedVideoUrl | null => {
  const host = url.hostname.toLowerCase();
  if (!["rutube.ru", "www.rutube.ru"].includes(host)) return null;

  const match = url.pathname.match(/^\/(?:video|shorts|play\/embed)\/([^/]+)\/?$/);
  const id = match?.[1] ?? "";
  if (!RUTUBE_VIDEO_ID.test(id)) return null;

  const normalizedId = id.toLowerCase();
  return {
    provider: "rutube",
    providerLabel: "RUTUBE",
    watchUrl: `https://rutube.ru/video/${normalizedId}/`,
    embedUrl: `https://rutube.ru/play/embed/${normalizedId}`,
  };
};

const parseVkVideoIds = (url: URL): { ownerId: string; videoId: string; hash?: string } | null => {
  if (url.pathname === "/video_ext.php") {
    const ownerId = url.searchParams.get("oid") ?? "";
    const videoId = url.searchParams.get("id") ?? "";
    const hash = url.searchParams.get("hash") ?? undefined;
    if (!VK_OWNER_ID.test(ownerId) || !VK_VIDEO_ID.test(videoId)) return null;
    if (hash && !VK_ACCESS_HASH.test(hash)) return null;
    return { ownerId, videoId, hash };
  }

  const pathMatch = url.pathname.match(/^\/video(-?\d+)_(\d+)\/?$/);
  if (pathMatch) return { ownerId: pathMatch[1], videoId: pathMatch[2] };

  const z = url.searchParams.get("z") ?? "";
  const queryMatch = z.match(/^video(-?\d+)_(\d+)(?:\/|$)/);
  return queryMatch ? { ownerId: queryMatch[1], videoId: queryMatch[2] } : null;
};

const normalizeVk = (url: URL): NormalizedVideoUrl | null => {
  const host = url.hostname.toLowerCase();
  if (!["vk.com", "www.vk.com", "m.vk.com", "vkvideo.ru", "www.vkvideo.ru"].includes(host)) {
    return null;
  }

  const ids = parseVkVideoIds(url);
  if (!ids) return null;

  const embedUrl = new URL("https://vk.com/video_ext.php");
  embedUrl.searchParams.set("oid", ids.ownerId);
  embedUrl.searchParams.set("id", ids.videoId);
  if (ids.hash) embedUrl.searchParams.set("hash", ids.hash);
  embedUrl.searchParams.set("hd", "2");

  return {
    provider: "vk",
    providerLabel: "VK Видео",
    watchUrl: `https://vk.com/video${ids.ownerId}_${ids.videoId}`,
    embedUrl: embedUrl.toString(),
  };
};

/**
 * Converts a supported public video link into fixed, trusted player URLs.
 * Arbitrary iframe markup and unrecognized hosts are deliberately rejected.
 */
export const normalizeVideoUrl = (rawValue: string): NormalizedVideoUrl | null => {
  const value = rawValue.trim();
  if (!value || value.length > MAX_VIDEO_URL_LENGTH || containsControlCharacter(value)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!hasAllowedConnectionDetails(url)) return null;

  return normalizeYouTube(url) ?? normalizeRutube(url) ?? normalizeVk(url);
};

export const getNormalizedVideoStorageUrl = (rawValue: string): string | null => {
  const video = normalizeVideoUrl(rawValue);
  if (!video) return null;
  // VK private/unlisted embeds need their validated access hash to keep playing.
  if (video.provider === "vk" && video.embedUrl.includes("hash=")) return video.embedUrl;
  return video.watchUrl;
};
