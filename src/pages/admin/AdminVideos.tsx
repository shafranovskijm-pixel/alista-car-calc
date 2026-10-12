import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CarVideo from "@/components/cars/CarVideo";
import { fetchAllSiteVideos, saveSiteVideo, type SiteVideo, type SiteVideoForm } from "@/lib/site-videos";

const emptyForm = (): SiteVideoForm => ({ title: "", video_url: "", sort_order: "10", is_published: false });
const toForm = (video: SiteVideo): SiteVideoForm => ({ title: video.title, video_url: video.video_url, sort_order: String(video.sort_order), is_published: video.is_published });
const messageFor = (error: unknown) => error instanceof Error ? error.message : "Проверьте соединение и доступ к разделу видео.";

const AdminVideos = () => {
  const [items, setItems] = useState<SiteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<SiteVideoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try { setItems(await fetchAllSiteVideos()); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const edit = (video?: SiteVideo) => {
    setEditingId(video?.id);
    setForm(video ? toForm(video) : emptyForm());
    setFormError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setFormError("");
    try {
      await saveSiteVideo(form, editingId);
      setForm(null);
      toast.success(form.is_published ? "Видео сохранено и опубликовано" : "Видео сохранено и скрыто с сайта");
      await load();
    } catch (error) { setFormError(messageFor(error)); }
    finally { setSaving(false); }
  };

  const togglePublished = async (video: SiteVideo) => {
    if (saving) return;
    setSaving(true);
    try {
      await saveSiteVideo({ ...toForm(video), is_published: !video.is_published }, video.id);
      toast.success(video.is_published ? "Видео скрыто с сайта" : "Видео опубликовано");
      await load();
    } catch (error) { toast.error(messageFor(error)); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Видео на главной</h1>
          <p className="mt-1 text-sm text-muted-foreground">Обзоры автомобилей и привозов из YouTube</p>
        </div>
        <Button onClick={() => edit()} disabled={saving || !!form || loadError}><Plus className="mr-2 h-4 w-4" />Добавить видео</Button>
      </div>
      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        Вставьте ссылку на отдельный ролик или Shorts. На главной показываются первые 3 опубликованных видео: меньшее число в «Порядке показа» — раньше. Новые ролики канала не добавляются автоматически. Видео конкретного автомобиля можно добавить отдельно в его карточке.
      </div>

      {form && (
        <form onSubmit={submit} className="mb-8 grid min-w-0 gap-6 rounded-xl border border-primary/30 bg-card p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0 space-y-5">
            <h2 className="text-lg font-semibold">{editingId ? "Изменить видео" : "Новое видео"}</h2>
            <div className="space-y-2"><Label htmlFor="site-video-title">Название *</Label><Input id="site-video-title" value={form.title} maxLength={160} required disabled={saving} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Например: Toyota Corolla — обзор автомобиля" /></div>
            <div className="space-y-2"><Label htmlFor="site-video-url">Ссылка YouTube *</Label><Input id="site-video-url" type="url" value={form.video_url} required disabled={saving} onChange={(event) => setForm({ ...form, video_url: event.target.value })} placeholder="https://www.youtube.com/shorts/..." /><p className="text-xs text-muted-foreground">Поддерживаются youtube.com/watch, youtube.com/shorts и youtu.be. Ссылка на канал не подходит.</p></div>
            <div className="space-y-2"><Label htmlFor="site-video-order">Порядок показа</Label><Input id="site-video-order" type="number" min={0} max={9999} step={1} required value={form.sort_order} disabled={saving} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="max-w-40" /></div>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_published} disabled={saving} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} className="h-4 w-4 accent-primary" />Показывать на главной странице</label>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <div className="flex flex-wrap gap-3"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Сохранить видео</Button><Button type="button" variant="outline" disabled={saving} onClick={() => { setForm(null); setFormError(""); }}>Отмена</Button></div>
          </div>
          <div className="min-w-0"><p className="mb-2 text-sm font-medium">Предпросмотр</p><CarVideo url={form.video_url} title={form.title || "Предпросмотр видео"} aspectRatio="portrait" showThumbnail /><p className="mt-3 text-xs text-muted-foreground">До сохранения изменения не отображаются на сайте.</p></div>
        </form>
      )}

      {loading ? <div role="status" aria-label="Загрузка видео" className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : loadError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-6"><p>Не удалось загрузить видео. Проверьте соединение и доступ к разделу.</p><Button variant="outline" onClick={() => void load()} className="mt-4">Повторить загрузку</Button></div>
      ) : items.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground"><Youtube className="mx-auto mb-3 h-8 w-8" /><p>Пока нет видео. Нажмите «Добавить видео».</p></div> : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((video) => (
            <article key={video.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
              <div className="mx-auto max-w-56"><CarVideo url={video.video_url} title={video.title} aspectRatio="portrait" showThumbnail /></div>
              <h2 className="mt-4 break-words font-semibold">{video.title}</h2>
              <p className="mt-2 text-xs text-muted-foreground">{video.is_published ? "Опубликовано" : "Скрыто"} · Порядок: {video.sort_order}</p>
              <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={saving || !!form} onClick={() => edit(video)}><Pencil className="mr-2 h-4 w-4" />Изменить</Button><Button size="sm" variant="ghost" disabled={saving || !!form} onClick={() => void togglePublished(video)}>{video.is_published ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{video.is_published ? "Скрыть" : "Опубликовать"}</Button></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVideos;
