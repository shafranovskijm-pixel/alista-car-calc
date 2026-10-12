import { useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { normalizeVideoUrl, getYouTubeThumbnailUrl, type NormalizedVideoUrl } from "@/lib/video";

type CarVideoProps = {
  url: string;
  title: string;
  className?: string;
  aspectRatio?: "landscape" | "portrait";
  showThumbnail?: boolean;
};

const VideoPreview = ({
  video,
  title,
  aspectRatio,
  showThumbnail,
}: {
  video: NormalizedVideoUrl;
  title: string;
  aspectRatio: "landscape" | "portrait";
  showThumbnail: boolean;
}) => {
  const [playerEnabled, setPlayerEnabled] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnail = showThumbnail ? getYouTubeThumbnailUrl(video.watchUrl) : null;

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border border-border/50 bg-secondary ${aspectRatio === "portrait" ? "aspect-[9/16]" : "aspect-video"}`}>
        {playerEnabled ? (
          <iframe
            src={video.embedUrl}
            title={title}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlayerEnabled(true)}
            className="group relative flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-foreground transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            aria-label={`Включить видео ${video.providerLabel}: ${title}`}
          >
            {thumbnail && !thumbnailFailed && (
              <>
                <img
                  src={thumbnail}
                  alt={`Обложка видео: ${title}`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setThumbnailFailed(true)}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" aria-hidden="true" />
              </>
            )}
            <PlayCircle className={`relative h-14 w-14 ${thumbnail && !thumbnailFailed ? "text-white drop-shadow-lg" : "text-primary"}`} aria-hidden="true" />
            <span className={`relative font-medium ${thumbnail && !thumbnailFailed ? "text-white" : ""}`}>Смотреть видео на {video.providerLabel}</span>
            <span className={`relative max-w-md text-xs ${thumbnail && !thumbnailFailed ? "text-white/80" : "text-muted-foreground"}`}>
              Плеер загрузится после нажатия и установит соединение с видеосервисом.
            </span>
          </button>
        )}
      </div>
      <a
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Открыть на {video.providerLabel}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </>
  );
};

const CarVideo = ({ url, title, className = "", aspectRatio = "landscape", showThumbnail = false }: CarVideoProps) => {
  const video = normalizeVideoUrl(url);
  if (!video) return null;

  return (
    <div className={`min-w-0 ${className}`}>
      <VideoPreview key={video.embedUrl} video={video} title={title} aspectRatio={aspectRatio} showThumbnail={showThumbnail} />
    </div>
  );
};

export default CarVideo;
