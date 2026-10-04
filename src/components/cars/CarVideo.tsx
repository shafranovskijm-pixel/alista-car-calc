import { useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { normalizeVideoUrl } from "@/lib/video";

type CarVideoProps = {
  url: string;
  title: string;
  className?: string;
};

const CarVideo = ({ url, title, className = "" }: CarVideoProps) => {
  const [playerEnabled, setPlayerEnabled] = useState(false);
  const video = normalizeVideoUrl(url);
  if (!video) return null;

  return (
    <div className={className}>
      <div className="aspect-video overflow-hidden rounded-xl border border-border/50 bg-secondary">
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
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-foreground transition hover:bg-muted/70"
            aria-label={`Включить видео ${video.providerLabel}: ${title}`}
          >
            <PlayCircle className="h-12 w-12 text-primary" aria-hidden="true" />
            <span className="font-medium">Смотреть видео на {video.providerLabel}</span>
            <span className="max-w-md text-xs text-muted-foreground">
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
    </div>
  );
};

export default CarVideo;
