import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, toCanonicalUrl, type SeoConfig } from "@/lib/seo";

const upsertMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertCanonical = (canonicalPath: string | null) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (canonicalPath === null) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = toCanonicalUrl(canonicalPath);
};

const Seo = ({
  title,
  description,
  canonicalPath,
  robots = "index, follow",
  image = DEFAULT_OG_IMAGE,
}: SeoConfig) => {
  useEffect(() => {
    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", robots);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    upsertCanonical(canonicalPath);

    const pageUrl = canonicalPath === null ? window.location.href : toCanonicalUrl(canonicalPath);
    upsertMeta('meta[property="og:url"]', "property", "og:url", pageUrl);
  }, [canonicalPath, description, image, robots, title]);

  return null;
};

export default Seo;
