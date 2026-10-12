import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAPAN_IMPORT_CAPTION, JAPAN_IMPORT_CARDS, loadCarouselShareFiles } from "@/lib/japan-import-carousel";
import JapanImportGuide from "./JapanImportGuide";

vi.mock("@/components/Layout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/japan-import-carousel", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/japan-import-carousel")>(),
  loadCarouselShareFiles: vi.fn(),
}));

const renderGuide = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><JapanImportGuide /></MemoryRouter>);
const testFiles = JAPAN_IMPORT_CARDS.map((card) => new File(["png"], `${card.stem}.png`, { type: "image/png" }));

beforeEach(() => { vi.mocked(loadCarouselShareFiles).mockReset(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("JapanImportGuide", () => {
  it("offers all original images and downloads with lazy previews", () => {
    renderGuide();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("8 карточках");
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(8);
    expect(images[0]).toHaveAttribute("loading", "eager");
    images.slice(1).forEach((image) => expect(image).toHaveAttribute("loading", "lazy"));
    expect(screen.getByRole("link", { name: "Скачать 8 карточек и текст" })).toHaveAttribute("href", "/media/japan-import-guide/ALISTA-Instagram-carousel.zip");
    expect(screen.getAllByRole("link", { name: /Скачать PNG/ })).toHaveLength(8);
    expect(screen.getByLabelText("Текст поста для копирования")).toHaveValue(JAPAN_IMPORT_CAPTION);
    expect(screen.getByText(/Instagram может быть доступен/)).toBeInTheDocument();
  });

  it("provides a download fallback without fetching images if sharing is unsupported", () => {
    vi.stubGlobal("navigator", {});
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Подготовить карточки для обмена" }));
    expect(screen.getByText(/Этот браузер не поддерживает передачу изображений/)).toBeInTheDocument();
    expect(loadCarouselShareFiles).not.toHaveBeenCalled();
  });

  it("requires a second click after loading files and does not auto-share or auto-post", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { share, canShare });
    vi.mocked(loadCarouselShareFiles).mockResolvedValue(testFiles);
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Подготовить карточки для обмена" }));
    const shareButton = await screen.findByRole("button", { name: "Выбрать приложение" });
    expect(share).not.toHaveBeenCalled();
    expect(canShare).toHaveBeenCalledWith({ files: testFiles });

    fireEvent.click(shareButton);
    await waitFor(() => expect(share).toHaveBeenCalledWith({ files: testFiles }));
    expect(await screen.findByText("Продолжите публикацию в выбранном приложении. Сайт не публикует пост автоматически.")).toBeInTheDocument();
  });

  it("handles cancellation calmly and retains prepared files for retry", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")), canShare: vi.fn().mockReturnValue(true) });
    vi.mocked(loadCarouselShareFiles).mockResolvedValue(testFiles);
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Подготовить карточки для обмена" }));
    fireEvent.click(await screen.findByRole("button", { name: "Выбрать приложение" }));
    expect(await screen.findByText("Отправка отменена. Можно повторить или скачать карточки.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выбрать приложение" })).toBeEnabled();
  });

  it("does not offer sharing when multiple image files are rejected", async () => {
    const share = vi.fn();
    vi.stubGlobal("navigator", { share, canShare: vi.fn().mockReturnValue(false) });
    vi.mocked(loadCarouselShareFiles).mockResolvedValue(testFiles);
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Подготовить карточки для обмена" }));
    expect(await screen.findByText(/Браузер не может передать сразу 8 изображений/)).toBeInTheDocument();
    expect(share).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Выбрать приложение" })).not.toBeInTheDocument();
  });

  it("keeps manual downloads available after loading or share failure", async () => {
    vi.stubGlobal("navigator", { share: vi.fn(), canShare: vi.fn() });
    vi.mocked(loadCarouselShareFiles).mockRejectedValue(new Error("Network"));
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Подготовить карточки для обмена" }));
    expect(await screen.findByText(/Не удалось подготовить все изображения/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Скачать 8 карточек и текст" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подготовить карточки для обмена" })).toBeEnabled();
  });

  it("copies the caption and selects it manually when clipboard is blocked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "Скопировать подпись" }));
    expect(await screen.findByText(/Текст скопирован/)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(JAPAN_IMPORT_CAPTION);

    writeText.mockRejectedValue(new Error("Blocked"));
    fireEvent.click(screen.getByRole("button", { name: "Скопировать подпись" }));
    expect(await screen.findByText(/Текст выделен — скопируйте его вручную/)).toBeInTheDocument();
    const field = screen.getByLabelText("Текст поста для копирования") as HTMLTextAreaElement;
    expect(field).toHaveFocus();
    expect(field.selectionEnd).toBe(JAPAN_IMPORT_CAPTION.length);
  });
});
