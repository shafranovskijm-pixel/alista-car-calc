import type { SyntheticEvent } from "react";

export const retryImageOnce = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") return;

  if (image.dataset.retryAttempted !== "true") {
    image.dataset.retryAttempted = "true";
    const retryUrl = new URL(image.currentSrc || image.src, window.location.href);
    retryUrl.searchParams.set("__retry", Date.now().toString());
    window.setTimeout(() => {
      image.src = retryUrl.toString();
    }, 500);
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = "/placeholder.svg";
};
