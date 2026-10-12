import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublishedSiteVideos, type SiteVideo } from "@/lib/site-videos";
import VideoReviews from "./VideoReviews";

vi.mock("@/lib/site-videos", async (original) => ({ ...(await original<typeof import("@/lib/site-videos")>()), fetchPublishedSiteVideos: vi.fn() }));
vi.mock("@/lib/retry", () => ({ withRetry: (operation: () => Promise<unknown>) => operation() }));

const video: SiteVideo = { id: "video-id", title: "Toyota BZ3X", video_url: "https://www.youtube.com/watch?v=Fc-XxnLPPTQ", sort_order: 10, is_published: true, created_at: "2026-10-12", updated_at: "2026-10-12" };
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("homepage video reviews", () => {
  it("renders real saved video rows without loading players", async () => {
    vi.mocked(fetchPublishedSiteVideos).mockResolvedValue([video]);
    const { container } = render(<VideoReviews />);
    const article = (await screen.findByRole("heading", { name: "Toyota BZ3X" })).closest("article")!;
    expect(within(article).getByRole("img")).toHaveAttribute("src", "https://i.ytimg.com/vi/Fc-XxnLPPTQ/hqdefault.jpg");
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: "Все видео на YouTube" })).toHaveAttribute("href", "https://www.youtube.com/@AlistaAvto");
  });

  it("does not fabricate a selection if the database is unavailable", async () => {
    vi.mocked(fetchPublishedSiteVideos).mockRejectedValue(new Error("table unavailable"));
    render(<VideoReviews />);
    expect(await screen.findByText(/Не удалось загрузить подборку/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Включить видео/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Все видео на YouTube" })).toBeInTheDocument();
  });

  it("respects an empty published selection and still offers the channel", async () => {
    vi.mocked(fetchPublishedSiteVideos).mockResolvedValue([]);
    render(<VideoReviews />);
    expect(await screen.findByText("Все обзоры и новые привозы — на нашем YouTube-канале.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Включить видео/ })).not.toBeInTheDocument();
  });
});
