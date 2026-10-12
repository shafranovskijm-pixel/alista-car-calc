import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllSiteVideos, fetchPublishedSiteVideos, saveSiteVideo, validateSiteVideo, type SiteVideoForm } from "./site-videos";

const mocks = vi.hoisted(() => ({ from: vi.fn(), result: { data: [] as unknown, error: null as unknown }, query: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/integrations/supabase/proxy-client", () => ({ supabase: { from: mocks.from } }));

const form: SiteVideoForm = { title: "  Toyota BZ3X  ", video_url: "https://www.youtube.com/shorts/Fc-XxnLPPTQ?feature=share", sort_order: "10", is_published: true };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = { data: [], error: null };
  const methods = ["select", "eq", "order", "limit", "insert", "update", "single"];
  mocks.query = Object.fromEntries(methods.map((method) => [method, vi.fn(() => mocks.query)]));
  Object.assign(mocks.query, { then: (resolve: (value: unknown) => void) => resolve(mocks.result) });
  mocks.from.mockReturnValue(mocks.query);
});

describe("site video validation", () => {
  it("trims titles and canonicalizes a verified Shorts URL", () => {
    expect(validateSiteVideo(form)).toEqual({ title: "Toyota BZ3X", video_url: "https://www.youtube.com/watch?v=Fc-XxnLPPTQ", sort_order: 10, is_published: true });
  });

  it.each(["", " ", "x".repeat(161)])("rejects an invalid title", (title) => {
    expect(() => validateSiteVideo({ ...form, title })).toThrow(/название/);
  });

  it.each(["https://www.youtube.com/@AlistaAvto", "https://youtube.com/playlist?list=PLabc", "javascript:alert(1)", "https://youtube.com.evil.example/shorts/Fc-XxnLPPTQ", "https://vk.com/video-123_456", "<iframe src='https://youtu.be/Fc-XxnLPPTQ'></iframe>"])("rejects non-YouTube-video input: %s", (video_url) => {
    expect(() => validateSiteVideo({ ...form, video_url })).toThrow(/отдельное видео/);
  });

  it.each(["", " ", "-1", "0.5", "NaN", "10000"])("rejects invalid sorting: %s", (sort_order) => {
    expect(() => validateSiteVideo({ ...form, sort_order })).toThrow(/целым числом/);
  });
});

describe("site video persistence", () => {
  it("fetches only published rows in deterministic order with a three-video limit", async () => {
    await fetchPublishedSiteVideos();
    expect(mocks.from).toHaveBeenCalledWith("site_videos");
    expect(mocks.query.eq).toHaveBeenCalledWith("is_published", true);
    expect(mocks.query.order).toHaveBeenNthCalledWith(1, "sort_order", { ascending: true });
    expect(mocks.query.order).toHaveBeenNthCalledWith(2, "created_at", { ascending: false });
    expect(mocks.query.limit).toHaveBeenCalledWith(3);
  });

  it("CRM fetch includes hidden records, without a public-page limit", async () => {
    await fetchAllSiteVideos();
    expect(mocks.query.eq).not.toHaveBeenCalled();
    expect(mocks.query.limit).not.toHaveBeenCalled();
  });

  it("inserts only after explicit validated save", async () => {
    mocks.result.data = { id: "new-id" };
    await saveSiteVideo(form);
    expect(mocks.query.insert).toHaveBeenCalledWith(validateSiteVideo(form));
    expect(mocks.query.update).not.toHaveBeenCalled();
  });

  it("updates the selected row, with checked save confirmation", async () => {
    mocks.result.data = { id: "video-id" };
    await saveSiteVideo({ ...form, is_published: false }, "video-id");
    expect(mocks.query.update).toHaveBeenCalledWith({ ...validateSiteVideo(form), is_published: false });
    expect(mocks.query.eq).toHaveBeenCalledWith("id", "video-id");
    expect(mocks.query.single).toHaveBeenCalled();
  });

  it("does not write invalid URLs", async () => {
    await expect(saveSiteVideo({ ...form, video_url: "https://youtube.com/@AlistaAvto" })).rejects.toThrow(/отдельное видео/);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reports duplicates instead of silently overwriting an existing row", async () => {
    mocks.result.error = { code: "23505" };
    await expect(saveSiteVideo(form)).rejects.toThrow(/уже добавлено/);
  });

  it("propagates unavailable database errors, without fake fallback records", async () => {
    const error = new Error("relation not available");
    mocks.result.error = error;
    await expect(fetchPublishedSiteVideos()).rejects.toBe(error);
  });
});
