import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Copy, Download, ExternalLink, Loader2, Share2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { CAROUSEL_DOWNLOADS, JAPAN_IMPORT_CAPTION, JAPAN_IMPORT_CARDS, isShareCancelled, loadCarouselShareFiles } from "@/lib/japan-import-carousel";

const JapanImportGuide = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const loadingController = useRef<AbortController | null>(null);
  const captionField = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => () => loadingController.current?.abort(), []);

  const prepareFiles = async () => {
    if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
      setStatus("Этот браузер не поддерживает передачу изображений в приложения. Скачайте карточки и добавьте их в Instagram вручную.");
      return;
    }
    setPreparing(true);
    setStatus("Загружаем 8 оригиналов. Это может занять немного времени.");
    const controller = new AbortController();
    loadingController.current = controller;
    try {
      const loadedFiles = await loadCarouselShareFiles(controller.signal);
      if (!navigator.canShare({ files: loadedFiles })) {
        setStatus("Браузер не может передать сразу 8 изображений. Скачайте карточки и выберите их в Instagram вручную.");
        return;
      }
      setFiles(loadedFiles);
      setStatus("8 карточек готовы. Нажмите «Выбрать приложение». Если Instagram доступен в меню устройства, выберите его.");
    } catch (error) {
      if (!isShareCancelled(error)) {
        setStatus("Не удалось подготовить все изображения. Попробуйте ещё раз или скачайте архив / отдельные карточки.");
      }
    } finally {
      if (!controller.signal.aborted) setPreparing(false);
    }
  };

  const shareFiles = async () => {
    setSharing(true);
    try {
      // Files were loaded by a separate action: share() needs a fresh user click.
      await navigator.share({ files });
      setStatus("Продолжите публикацию в выбранном приложении. Сайт не публикует пост автоматически.");
    } catch (error) {
      setStatus(isShareCancelled(error)
        ? "Отправка отменена. Можно повторить или скачать карточки."
        : "Устройство не смогло передать карточки. Скачайте изображения и загрузите их в Instagram вручную.");
    } finally {
      setSharing(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(JAPAN_IMPORT_CAPTION);
      setCopyStatus("Текст скопирован. Вставьте его в подпись к публикации.");
    } catch {
      captionField.current?.focus();
      captionField.current?.select();
      setCopyStatus("Браузер не разрешил копирование. Текст выделен — скопируйте его вручную или скачайте файл.");
    }
  };

  return (
    <Layout>
      <div className="container min-w-0 py-10 md:py-16">
        <Link to="/#japan-buying-guide" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />На главную · инструкция по покупке</Link>
        <header className="mt-6 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">ALISTA · маршрут автомобиля</p>
          <h1 className="mt-4 text-balance font-heading text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl md:text-5xl">Как привезти авто из Японии — в 8 карточках</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">Все 9 этапов покупки: от обращения и подбора до передачи ключей. Сохраните инструкцию себе или поделитесь ею.</p>
          <Button asChild variant="link" className="mt-3 h-auto whitespace-normal px-0 py-3 text-left"><Link to="/contacts">Обсудить подбор и предварительный расчёт<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link></Button>
        </header>

        <section aria-labelledby="carousel-sharing-heading" className="mt-8 min-w-0 rounded-3xl border border-primary/25 bg-primary/5 p-5 sm:p-8">
          <div className="grid min-w-0 gap-8 lg:grid-cols-2">
            <div className="min-w-0">
              <h2 id="carousel-sharing-heading" className="font-heading text-xl font-bold sm:text-2xl">Сохранить и поделиться</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">В архиве — 8 оригинальных PNG и текст поста. Для карусели загружайте карточки по порядку 01–08.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild className="h-auto min-h-11 whitespace-normal rounded-full py-3"><a href={CAROUSEL_DOWNLOADS.package} download><Download className="h-4 w-4 shrink-0" aria-hidden="true" />Скачать 8 карточек и текст</a></Button>
                <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal rounded-full border-primary/25 py-3"><a href={CAROUSEL_DOWNLOADS.caption} download="ALISTA-текст-поста.txt">Скачать текст поста</a></Button>
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold">В Instagram с телефона</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Кнопка ниже открывает меню обмена вашего устройства. Instagram может быть доступен, если приложение установлено и принимает изображения. Его наличие в меню и формат публикации зависят от телефона и приложения.</p>
              <Button type="button" variant="outline" disabled={preparing || sharing} onClick={files.length ? shareFiles : prepareFiles} className="mt-5 h-auto min-h-11 w-full whitespace-normal rounded-full border-primary/40 py-3 sm:w-auto">
                {preparing || sharing ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {preparing ? "Подготовка карточек…" : sharing ? "Открываем меню…" : files.length ? "Выбрать приложение" : "Подготовить карточки для обмена"}
              </Button>
              <p role="status" aria-live="polite" className="mt-3 text-sm leading-relaxed text-muted-foreground">{status}</p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Если Instagram нет в меню: сохраните отдельные карточки ниже, откройте Instagram, создайте публикацию, выберите 8 изображений и вставьте подпись. Ничего не публикуется без вашего действия.</p>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">Открыть Instagram ALISTA<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section aria-labelledby="carousel-cards-heading" className="mt-12">
          <h2 id="carousel-cards-heading" className="font-heading text-2xl font-bold">Карточки по порядку</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Нажмите на изображение, чтобы открыть оригинал. Иллюстрации показывают этапы покупки, а не конкретные доставленные автомобили.</p>
          <ol className="mt-6 grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {JAPAN_IMPORT_CARDS.map((card, index) => (
              <li key={card.stem} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-secondary/40">
                <figure>
                  <a href={card.original} target="_blank" rel="noopener noreferrer" aria-label={`Открыть карточку ${card.number}: ${card.title}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                    <img src={card.preview} width={1092} height={1440} loading={index === 0 ? "eager" : "lazy"} decoding="async" alt={`Карточка ${card.number}. ${card.title}. ${card.description}`} className="h-auto w-full" />
                  </a>
                  <figcaption className="p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Карточка {card.number} / 08</p>
                    <h3 className="mt-2 font-semibold leading-snug">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                    <a href={card.original} download={`${card.stem}.png`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"><Download className="h-4 w-4" aria-hidden="true" />Скачать PNG {card.number}</a>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="carousel-caption-heading" className="mt-12 rounded-3xl border border-border bg-secondary/30 p-5 sm:p-8">
          <h2 id="carousel-caption-heading" className="font-heading text-2xl font-bold">Готовая подпись к посту</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Скопируйте текст отдельно: приложение может не переносить подпись вместе с изображениями.</p>
          <label htmlFor="japan-carousel-caption" className="sr-only">Текст поста для копирования</label>
          <textarea ref={captionField} id="japan-carousel-caption" readOnly value={JAPAN_IMPORT_CAPTION} rows={14} className="mt-5 w-full min-w-0 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <Button type="button" onClick={copyCaption} variant="outline" className="mt-4 min-h-11 rounded-full border-primary/30"><Copy className="h-4 w-4" aria-hidden="true" />Скопировать подпись</Button>
          <p role="status" aria-live="polite" className="mt-3 text-sm text-muted-foreground">{copyStatus}</p>
        </section>
      </div>
    </Layout>
  );
};

export default JapanImportGuide;
