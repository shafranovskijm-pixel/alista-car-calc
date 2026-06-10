import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import {
  fetchAllCars,
  resolveCarPhotoUrl,
  ensureUniqueCarSlug,
  makeCarSlug,
  CAR_COUNTRY_LABELS,
  CAR_STATUS_LABELS,
  formatPrice,
  type CarWithPhotos,
} from "@/lib/cars";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HintCard from "@/components/admin/HintCard";

const AdminCars = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<(CarWithPhotos & { coverUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchAllCars();
      const withCover = await Promise.all(
        rows.map(async (c) => {
          const cover = c.photos.find((p) => p.is_cover) ?? c.photos[0];
          const coverUrl = cover ? await resolveCarPhotoUrl(cover.url) : undefined;
          return { ...c, coverUrl };
        })
      );
      setItems(withCover);
    } catch (e: any) {
      toast.error("Не удалось загрузить: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublish = async (c: CarWithPhotos) => {
    const next = c.status === "draft" ? "in_stock" : "draft";
    const { error } = await supabase.from("cars").update({ status: next }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(next === "draft" ? "Скрыто" : "Опубликовано");
    load();
  };

  const remove = async (c: CarWithPhotos) => {
    if (!confirm(`Удалить «${c.title}»? Фото также удалятся.`)) return;
    const keys = c.photos
      .filter((p) => !/^https?:\/\//.test(p.url) && !p.url.startsWith("/"))
      .map((p) => p.url);
    if (keys.length) await supabase.storage.from("cars").remove(keys);
    const { error } = await supabase.from("cars").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    load();
  };

  const createNew = async () => {
    const brand = "Новая";
    const model = "карточка";
    const slug = await ensureUniqueCarSlug(makeCarSlug(brand, model) + "-" + Date.now());
    const { data, error } = await supabase
      .from("cars")
      .insert({
        title: `${brand} ${model}`,
        brand,
        model,
        slug,
        country: "japan",
        status: "draft",
      })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    navigate(`/admin/cars/${data.id}`);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Каталог авто</h1>
          <p className="text-sm text-muted-foreground">{items.length} карточек</p>
        </div>
        <Button onClick={createNew}>
          <Plus className="mr-2 h-4 w-4" />
          Новый авто
        </Button>
      </div>

      <div className="mb-4">
        <HintCard storageKey="cars" title="Публичный каталог автомобилей">
          Карточки авто для продажи на сайте: фото, цена, характеристики, расход топлива. Опубликованные
          карточки показываются в разделе «Каталог» на сайте Алисты. Используйте качественные фото
          и подробное описание — это влияет на конверсию заявок.
        </HintCard>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Пока нет авто. Нажмите «Новый авто», чтобы добавить первую карточку.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((c) => (
            <div key={c.id} className="rounded-lg border border-border overflow-hidden bg-card flex flex-col">
              <Link
                to={`/admin/cars/${c.id}`}
                className="block relative aspect-[4/3] bg-secondary overflow-hidden"
              >
                {c.coverUrl ? (
                  <img src={c.coverUrl} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Нет фото
                  </div>
                )}
                <span
                  className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs ${
                    c.status === "draft"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {CAR_STATUS_LABELS[c.status]}
                </span>
                <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs">
                  {c.photos.length} фото
                </span>
              </Link>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="line-clamp-2 text-sm font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPrice(c.price, c.currency)} · {CAR_COUNTRY_LABELS[c.country]}
                </div>
                <div className="mt-auto flex gap-1.5">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link to={`/admin/cars/${c.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Править
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(c)}
                    title={c.status === "draft" ? "Опубликовать" : "Скрыть"}
                  >
                    {c.status === "draft" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(c)}
                    className="text-destructive"
                  >
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

export default AdminCars;