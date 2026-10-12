import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Youtube } from "lucide-react";
import CarVideo from "@/components/cars/CarVideo";
import { ALISTA_YOUTUBE_CHANNEL_URL, fetchPublishedSiteVideos, type SiteVideo } from "@/lib/site-videos";
import { withRetry } from "@/lib/retry";

const VideoReviews = () => {
  const [items, setItems] = useState<SiteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    withRetry(fetchPublishedSiteVideos)
      .then((rows) => { if (!cancelled) setItems(rows); })
      .catch(() => { if (!cancelled) { setItems([]); setFailed(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <section id="video-reviews" className="min-w-0 py-16 sm:py-24" aria-labelledby="video-reviews-title">
      <div className="container mx-auto min-w-0 max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary"><Youtube className="h-5 w-5" aria-hidden="true" />ALISTA на YouTube</p>
            <h2 id="video-reviews-title" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Видеообзоры ALISTA</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">Смотрите автомобили и привозы в коротких видео нашей команды.</p>
          </div>
          <a href={ALISTA_YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-primary/30 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-secondary">
            Все видео на YouTube<ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center" role="status" aria-label="Загрузка видео"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" /></div>
        ) : items.length ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground sm:hidden">Листайте видео влево и вправо →</p>
            <div className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3" aria-label="Видеообзоры автомобилей">
              {items.map((video) => (
                <article key={video.id} className="w-[86%] min-w-[228px] shrink-0 snap-start rounded-2xl border border-border/50 bg-card p-3 sm:w-auto sm:min-w-0">
                  <CarVideo url={video.video_url} title={video.title} aspectRatio="portrait" showThumbnail />
                  <h3 className="mt-4 break-words px-1 pb-2 text-lg font-semibold leading-snug">{video.title}</h3>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">{failed ? "Не удалось загрузить подборку видео. Ролики доступны на нашем YouTube-канале." : "Все обзоры и новые привозы — на нашем YouTube-канале."}</p>
            {failed && <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 text-sm font-semibold text-primary hover:underline">Повторить загрузку видео</button>}
          </div>
        )}
        {items.length > 0 && <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Если плеер недоступен, откройте видео на YouTube по ссылке под ним. Цены и наличие из роликов уточняйте у менеджера.</p>}
      </div>
    </section>
  );
};

export default VideoReviews;
