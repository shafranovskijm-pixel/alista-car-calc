import { describe, expect, it } from "vitest";
import { getNormalizedVideoStorageUrl, normalizeVideoUrl } from "./video";

describe("normalizeVideoUrl", () => {
  it.each([
    "https://youtu.be/M7lc1UVf-VE?t=42",
    "https://www.youtube.com/watch?v=M7lc1UVf-VE&feature=share",
    "https://m.youtube.com/shorts/M7lc1UVf-VE",
    "https://youtube.com/embed/M7lc1UVf-VE",
  ])("normalizes supported YouTube links: %s", (url) => {
    expect(normalizeVideoUrl(url)).toEqual({
      provider: "youtube",
      providerLabel: "YouTube",
      watchUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
      embedUrl: "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
    });
  });

  it.each(["video", "shorts", "play/embed"])("normalizes a RUTUBE %s link", (kind) => {
    const id = "7716bd3e665725c3c008ae7ab4ff02e2";
    expect(normalizeVideoUrl(`https://rutube.ru/${kind}/${id}/`)).toEqual({
      provider: "rutube",
      providerLabel: "RUTUBE",
      watchUrl: `https://rutube.ru/video/${id}/`,
      embedUrl: `https://rutube.ru/play/embed/${id}`,
    });
  });

  it("normalizes a VK Video link without carrying unrelated query parameters", () => {
    expect(normalizeVideoUrl("https://vkvideo.ru/video-12345_67890?autoplay=1&evil=1")).toEqual({
      provider: "vk",
      providerLabel: "VK Видео",
      watchUrl: "https://vk.com/video-12345_67890",
      embedUrl: "https://vk.com/video_ext.php?oid=-12345&id=67890&hd=2",
    });
  });

  it("keeps only a valid VK embed access hash", () => {
    const video = normalizeVideoUrl(
      "https://vk.com/video_ext.php?oid=-12345&id=67890&hash=Abc_def-123&autoplay=1",
    );

    expect(video?.embedUrl).toBe(
      "https://vk.com/video_ext.php?oid=-12345&id=67890&hash=Abc_def-123&hd=2",
    );
    expect(video?.watchUrl).toBe("https://vk.com/video-12345_67890");
  });

  it.each([
    "javascript:alert(1)",
    "http://youtube.com/watch?v=M7lc1UVf-VE",
    "https://youtube.com.evil.example/watch?v=M7lc1UVf-VE",
    "https://evil.example/?next=https://youtu.be/M7lc1UVf-VE",
    "https://user:secret@youtube.com/watch?v=M7lc1UVf-VE",
    "https://youtube.com:444/watch?v=M7lc1UVf-VE",
    "<iframe src=\"https://youtu.be/M7lc1UVf-VE\"></iframe>",
    "https://youtu.be/not-valid",
    "https://rutube.ru/video/not-a-rutube-id/",
    "https://vk.com/video_ext.php?oid=-12&id=34&hash=<script>",
  ])("rejects unsafe or unsupported input: %s", (url) => {
    expect(normalizeVideoUrl(url)).toBeNull();
  });

  it("returns the canonical URL intended for storage", () => {
    expect(getNormalizedVideoStorageUrl(" https://youtu.be/M7lc1UVf-VE?t=12 ")).toBe(
      "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    );
  });

  it("preserves a validated VK access hash in the stored URL", () => {
    expect(
      getNormalizedVideoStorageUrl(
        "https://vk.com/video_ext.php?oid=-12345&id=67890&hash=Abc_def-123&autoplay=1",
      ),
    ).toBe("https://vk.com/video_ext.php?oid=-12345&id=67890&hash=Abc_def-123&hd=2");
  });
});
