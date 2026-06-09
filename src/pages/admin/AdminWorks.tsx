import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllWorks, resolvePhotoUrl, slugify, ensureUniqueSlug, type WorkWithPhotos } from "@/lib/works";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HintCard from "@/components/admin/HintCard";

const AdminWorks = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<(WorkWithPhotos & { coverUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchAllWorks();
      const withCover = await Promise.all(
        rows.map(async (w) => {
          const cover = w.photos.find((p) => p.is_cover) ?? w.photos[0];
          const coverUrl = cover ? await resolvePhotoUrl(cover.url) : undefined;
          return { ...w, coverUrl };
        })
      );
      setItems(withCover);
    } catch (e: any) {
      toast.error("Не удалось загрузить: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (w: WorkWithPhotos) => {
    const next = w.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("works").update({ status: next }).eq("id", w.id);
    if (error) return toast.error(error.message);
    toast.success(next === "published" ? "Опубликовано" : "Скрыто");
    load();
  };

  const remove = async (w: WorkWithPhotos) => {
    if (!confirm(`Удалить «${w.title}»? Фото в хранилище также удалятся.`)) return;
    // Delete photos from storage first
    const keys = w.photos.filter((p) => !/^https?:\/\//.test(p.url) && !p.url.startsWith("/")).map((p) => p.url);
    if (keys.length) await supabase.storage.from("works").remove(keys);
    const { error } = await supabase.from("works").delete().eq("id", w.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    load();
  };

  const createNew = async () => {
    const title = "Новая работа";
    const slug = await ensureUniqueSlug(slugify(title + "-" + Date.now()));
    const { data, error } = await supabase
      .from("works")
      .insert({ title, slug, status: "draft", sort_order: 0 })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    navigate(`/admin/works/${data.id}`);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Наши работы</h1>
          <p className="text-sm text-muted-foreground">{items.length} карточек в каталоге</p>
        </div>
        <Button onClick={createNew}><Plus className="mr-2 h-4 w-4" />Новая работа</Button>
      </div>

      <div className="mb-4">
        <HintCard storageKey="works" title="Портфолио для сайта">
          Раздел с фото выданных автомобилей. Опубликованные работы автоматически появляются на главной
          странице сайта в блоке «Наши работы» и в галерее. Загружайте 3–6 хороших фото на каждую машину,
          указывайте модель, год и комплектацию.
        </HintCard>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((w) => (
            <div key={w.id} className="rounded-lg border border-border overflow-hidden bg-card flex flex-col">
              <Link to={`/admin/works/${w.id}`} className="block relative aspect-[4/3] bg-secondary overflow-hidden">
                {w.coverUrl ? (
                  <img src={w.coverUrl} alt={w.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Нет фото</div>
                )}
                <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs ${
                  w.status === "published" ? "bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {w.status === "published" ? "Опубликовано" : "Черновик"}
                </span>
                <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs">
                  {w.photos.length} фото
                </span>
              </Link>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="line-clamp-2 text-sm font-medium">{w.title}</div>
                <div className="text-xs text-muted-foreground">
                  {w.price ? new Intl.NumberFormat("ru-RU").format(w.price) + " ₽" : "—"}
                  {w.country ? " · " + w.country : ""}
                </div>
                <div className="mt-auto flex gap-1.5">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link to={`/admin/works/${w.id}`}><Pencil className="h-3.5 w-3.5 mr-1" />Править</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(w)} title={w.status === "published" ? "Скрыть" : "Опубликовать"}>
                    {w.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(w)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWorks;