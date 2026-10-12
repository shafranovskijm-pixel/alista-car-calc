import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllSiteVideos, saveSiteVideo, type SiteVideo } from "@/lib/site-videos";
import AdminVideos from "./AdminVideos";

vi.mock("@/lib/site-videos", async (original) => ({ ...(await original<typeof import("@/lib/site-videos")>()), fetchAllSiteVideos: vi.fn(), saveSiteVideo: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const video: SiteVideo = { id: "video-id", title: "Toyota BZ3X", video_url: "https://www.youtube.com/watch?v=Fc-XxnLPPTQ", sort_order: 10, is_published: true, created_at: "2026-10-12", updated_at: "2026-10-12" };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchAllSiteVideos).mockResolvedValue([]); vi.mocked(saveSiteVideo).mockResolvedValue(); });
afterEach(cleanup);

describe("CRM site video management", () => {
  it("opening or cancelling a new form creates no database record", async () => {
    render(<AdminVideos />);
    await screen.findByText(/Пока нет видео/);
    fireEvent.click(screen.getByRole("button", { name: "Добавить видео" }));
    expect(screen.getByLabelText("Название *")).toBeInTheDocument();
    expect(saveSiteVideo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(saveSiteVideo).not.toHaveBeenCalled();
  });

  it("explicitly saves a client's title, link, sort and visibility", async () => {
    render(<AdminVideos />);
    await screen.findByText(/Пока нет видео/);
    fireEvent.click(screen.getByRole("button", { name: "Добавить видео" }));
    fireEvent.change(screen.getByLabelText("Название *"), { target: { value: "Hyundai Kona" } });
    fireEvent.change(screen.getByLabelText("Ссылка YouTube *"), { target: { value: "https://youtu.be/VZqSnqRDcsg" } });
    fireEvent.change(screen.getByLabelText("Порядок показа"), { target: { value: "5" } });
    fireEvent.click(screen.getByLabelText("Показывать на главной странице"));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить видео" }));
    await waitFor(() => expect(saveSiteVideo).toHaveBeenCalledWith({ title: "Hyundai Kona", video_url: "https://youtu.be/VZqSnqRDcsg", sort_order: "5", is_published: true }, undefined));
  });

  it("hides a saved video without deleting it", async () => {
    vi.mocked(fetchAllSiteVideos).mockResolvedValue([video]);
    render(<AdminVideos />);
    await screen.findByRole("heading", { name: "Toyota BZ3X" });
    fireEvent.click(screen.getByRole("button", { name: "Скрыть" }));
    await waitFor(() => expect(saveSiteVideo).toHaveBeenCalledWith({ title: "Toyota BZ3X", video_url: video.video_url, sort_order: "10", is_published: false }, "video-id"));
  });

  it("shows save errors and retains the form for correction", async () => {
    vi.mocked(saveSiteVideo).mockRejectedValue(new Error("Вставьте ссылку на отдельное видео"));
    render(<AdminVideos />);
    await screen.findByText(/Пока нет видео/);
    fireEvent.click(screen.getByRole("button", { name: "Добавить видео" }));
    fireEvent.change(screen.getByLabelText("Название *"), { target: { value: "Канал" } });
    fireEvent.change(screen.getByLabelText("Ссылка YouTube *"), { target: { value: "https://youtube.com/@AlistaAvto" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить видео" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Вставьте ссылку на отдельное видео");
    expect(screen.getByLabelText("Название *")).toHaveValue("Канал");
  });
});
