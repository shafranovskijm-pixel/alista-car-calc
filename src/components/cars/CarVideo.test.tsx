import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CarVideo from "./CarVideo";

afterEach(cleanup);

describe("click-to-load video player", () => {
  it("does not load an iframe or autoplay before a visitor chooses to play", () => {
    const { container } = render(<CarVideo url="https://youtube.com/shorts/Fc-XxnLPPTQ" title="Toyota BZ3X" showThumbnail aspectRatio="portrait" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("img", { name: "Обложка видео: Toyota BZ3X" })).toHaveAttribute("src", "https://i.ytimg.com/vi/Fc-XxnLPPTQ/hqdefault.jpg");
    expect(container.querySelector(".aspect-\\[9\\/16\\]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Включить видео YouTube: Toyota BZ3X" }));
    const player = screen.getByTitle("Toyota BZ3X");
    expect(player).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/Fc-XxnLPPTQ");
    expect(player).toHaveAttribute("loading", "lazy");
    expect(player.getAttribute("src")).not.toContain("autoplay");
    expect(screen.getByRole("link", { name: "Открыть на YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=Fc-XxnLPPTQ");
  });

  it("preserves the existing landscape aspect ratio and no-thumbnail default for car pages", () => {
    const { container } = render(<CarVideo url="https://youtu.be/Fc-XxnLPPTQ" title="Автомобиль" />);
    expect(container.querySelector(".aspect-video")).not.toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps a playable placeholder and external link when the thumbnail fails", () => {
    render(<CarVideo url="https://youtu.be/Fc-XxnLPPTQ" title="Toyota" showThumbnail />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Включить видео YouTube: Toyota" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть на YouTube" })).toBeInTheDocument();
  });

  it("resets the loaded player when editing a different video", () => {
    const { rerender, container } = render(<CarVideo url="https://youtu.be/Fc-XxnLPPTQ" title="Toyota" />);
    fireEvent.click(screen.getByRole("button"));
    expect(container.querySelector("iframe")).not.toBeNull();
    rerender(<CarVideo url="https://youtu.be/VZqSnqRDcsg" title="Hyundai" />);
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("does not create a player for a channel link or unsafe iframe HTML", () => {
    const { container } = render(<CarVideo url="https://www.youtube.com/@AlistaAvto" title="Канал" />);
    expect(container).toBeEmptyDOMElement();
  });
});
