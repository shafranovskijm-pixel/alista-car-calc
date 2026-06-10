import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Trash2, Star, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import {
  fetchWork, uploadWorkPhoto, resolvePhotoUrl, deleteWorkPhotoFromStorage,
  slugify, ensureUniqueSlug, type WorkPhoto, type WorkWithPhotos,
} from "@/lib/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PhotoUI = WorkPhoto & { displayUrl: string };

const SortablePhoto = ({
  photo, onCover, onDelete,
}: { photo: PhotoUI; onCover: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-lg overflow-hidden border border-border bg-secondary">
      <img src={photo.displayUrl} alt="" className="w-full aspect-square object-cover" loading="lazy" />
      {photo.is_cover && (
        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">обложка</span>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
        <button type="button" {...attributes} {...listeners} className="p-2 rounded bg-background/80 cursor-grab active:cursor-grabbing" title="Перетащить">
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onCover} className="p-2 rounded bg-background/80" title="Сделать обложкой">
          <Star className={`h-4 w-4 ${photo.is_cover ? "fill-primary text-primary" : ""}`} />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded bg-background/80 text-destructive" title="Удалить">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const AdminWorkEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [work, setWork] = useState<WorkWithPhotos | null>(null);
  const [photos, setPhotos] = useState<PhotoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // form
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("published");
  const [sortOrder, setSortOrder] = useState<string>("0");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const w = await fetchWork(id);
      if (!w) { toast.error("Работа не найдена"); navigate("/admin/works"); return; }
      setWork(w);
      setTitle(w.title); setBrand(w.brand ?? ""); setModel(w.model ?? "");
      setYear(w.year ? String(w.year) : ""); setPrice(w.price ? String(w.price) : "");
      setCountry(w.country ?? ""); setDescription(w.description ?? "");
      setStatus(w.status); setSortOrder(String(w.sort_order));
      const resolved = await Promise.all(
        w.photos.map(async (p) => ({ ...p, displayUrl: await resolvePhotoUrl(p.url) }))
      );
      setPhotos(resolved);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const save = async () => {
    if (!work) return;
    setSaving(true);
    try {
      let slug = work.slug;
      if (title !== work.title) {
        slug = await ensureUniqueSlug(slugify(title), work.id);
      }
      const { error } = await supabase.from("works").update({
        title, slug,
        brand: brand || null, model: model || null,
        year: year ? parseInt(year, 10) : null,
        price: price ? parseInt(price, 10) : null,
        country: country || null,
        description: description || null,
        status, sort_order: parseInt(sortOrder, 10) || 0,
      }).eq("id", work.id);
      if (error) throw error;
      toast.success("Сохранено");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !work) return;
    setUploading(true);
    try {
      const startOrder = photos.length;
      const hasCover = photos.some((p) => p.is_cover);
      let i = 0;
      for (const file of Array.from(files)) {
        const key = await uploadWorkPhoto(work.id, file);
        const { error } = await supabase.from("work_photos").insert({
          work_id: work.id, url: key, sort_order: startOrder + i,
          is_cover: !hasCover && i === 0 && startOrder === 0,
        });
        if (error) throw error;
        i += 1;
      }
      toast.success(`Загружено: ${i}`);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const setCover = async (photoId: string) => {
    if (!work) return;
    await supabase.from("work_photos").update({ is_cover: false }).eq("work_id", work.id);
    const { error } = await supabase.from("work_photos").update({ is_cover: true }).eq("id", photoId);
    if (error) return toast.error(error.message);
    load();
  };

  const deletePhoto = async (photo: PhotoUI) => {
    if (!confirm("Удалить фото?")) return;
    await deleteWorkPhotoFromStorage(photo.url);
    const { error } = await supabase.from("work_photos").delete().eq("id", photo.id);
    if (error) return toast.error(error.message);
    load();
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = photos.findIndex((p) => p.id === active.id);
    const newIdx = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, oldIdx, newIdx);
    setPhotos(next);
    // persist sort_order
    await Promise.all(
      next.map((p, idx) =>
        supabase.from("work_photos").update({ sort_order: idx }).eq("id", p.id)
      )
    );
  };

  const deleteWork = async () => {
    if (!work) return;
    if (!confirm(`Удалить «${work.title}»?`)) return;
    const keys = photos.filter((p) => !/^https?:\/\//.test(p.url) && !p.url.startsWith("/")).map((p) => p.url);
    if (keys.length) await supabase.storage.from("works").remove(keys);
    const { error } = await supabase.from("works").delete().eq("id", work.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    navigate("/admin/works");
  };

  if (loading || !work) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="max-w-5xl">
      <Link to="/admin/works" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> К списку
      </Link>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold truncate">{title || "Без названия"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={deleteWork} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Удалить
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Сохранить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label>Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Марка</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
            <div><Label>Модель</Label><Input value={model} onChange={(e) => setModel(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Год</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
            <div className="col-span-2"><Label>Цена (₽)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Страна</Label>
              <Select value={country || "none"} onValueChange={(v) => setCountry(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="Китай">Китай</SelectItem>
                  <SelectItem value="Япония">Япония</SelectItem>
                  <SelectItem value="Корея">Корея</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Опубликовано</SelectItem>
                  <SelectItem value="draft">Черновик</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Порядок (больше — выше)</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea rows={10} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Фотографии ({photos.length})</Label>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Загрузить
            </Button>
            <input
              ref={fileRef} type="file" accept="image/*" multiple hidden
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
          {photos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Нет фото. Загрузите изображения.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <SortablePhoto
                      key={p.id} photo={p}
                      onCover={() => setCover(p.id)}
                      onDelete={() => deletePhoto(p)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Перетащите фото, чтобы изменить порядок. Звёздочка — сделать обложкой.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkEdit;