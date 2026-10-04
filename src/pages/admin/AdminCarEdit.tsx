import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Trash2, Star, GripVertical, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/proxy-client";
import {
  fetchCar,
  uploadCarPhoto,
  validateCarPhoto,
  resolveCarPhotoUrl,
  deleteCarPhotoFromStorage,
  ensureUniqueCarSlug,
  makeCarSlug,
  makeCarDisplayTitle,
  CAR_COUNTRY_LABELS,
  CAR_STATUS_LABELS,
  CAR_TRANSMISSION_LABELS,
  CAR_FUEL_LABELS,
  type CarPhoto,
  type CarWithPhotos,
  type CarCountry,
  type CarStatus,
  type CarTransmission,
  type CarFuel,
} from "@/lib/cars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CarVideo from "@/components/cars/CarVideo";
import { getNormalizedVideoStorageUrl, normalizeVideoUrl } from "@/lib/video";

type PhotoUI = CarPhoto & { displayUrl: string };

const SortablePhoto = ({
  photo,
  onCover,
  onDelete,
}: {
  photo: PhotoUI;
  onCover: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden border border-border bg-secondary"
    >
      <img src={photo.displayUrl} alt="" className="w-full aspect-square object-cover" loading="lazy" />
      {photo.is_cover && (
        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
          обложка
        </span>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 rounded bg-background/80 cursor-grab active:cursor-grabbing"
          title="Перетащить"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onCover} className="p-2 rounded bg-background/80" title="Обложка">
          <Star className={`h-4 w-4 ${photo.is_cover ? "fill-primary text-primary" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded bg-background/80 text-destructive"
          title="Удалить"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const AdminCarEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [car, setCar] = useState<CarWithPhotos | null>(null);
  const [photos, setPhotos] = useState<PhotoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [power, setPower] = useState("");
  const [transmission, setTransmission] = useState<CarTransmission | "">("");
  const [fuel, setFuel] = useState<CarFuel | "">("");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [country, setCountry] = useState<CarCountry>("japan");
  const [status, setStatus] = useState<CarStatus>("in_stock");
  const [description, setDescription] = useState("");
  const [auctionUrl, setAuctionUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const videoPreview = videoUrl.trim() ? normalizeVideoUrl(videoUrl) : null;
  const videoUrlIsInvalid = Boolean(videoUrl.trim() && !videoPreview);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await fetchCar(id);
      if (!c) {
        toast.error("Авто не найдено");
        navigate("/admin/cars");
        return;
      }
      setCar(c);
      setTitle(c.title);
      setBrand(c.brand);
      setModel(c.model);
      setYear(c.year ? String(c.year) : "");
      setEngine(c.engine_volume ? String(c.engine_volume) : "");
      setPower(c.power_hp ? String(c.power_hp) : "");
      setTransmission(c.transmission ?? "");
      setFuel(c.fuel ?? "");
      setMileage(c.mileage_km ? String(c.mileage_km) : "");
      setPrice(c.price ? String(c.price) : "");
      setCurrency(c.currency || "RUB");
      setCountry(c.country);
      setStatus(c.status);
      setDescription(c.description ?? "");
      setAuctionUrl(c.auction_sheet_url ?? "");
      setVideoUrl(c.video_url ?? "");
      setSortOrder(String(c.sort_order));
      const resolved = await Promise.all(
        c.photos.map(async (p) => ({ ...p, displayUrl: await resolveCarPhotoUrl(p.url) }))
      );
      setPhotos(resolved);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!car) return;
    if (!brand.trim() || !model.trim()) {
      toast.error("Укажите марку и модель");
      return;
    }
    if (status !== "draft" && photos.length === 0) {
      toast.error("Перед публикацией добавьте хотя бы одну фотографию");
      return;
    }
    const normalizedVideoUrl = videoUrl.trim()
      ? getNormalizedVideoStorageUrl(videoUrl)
      : null;
    if (videoUrl.trim() && !normalizedVideoUrl) {
      toast.error("Укажите корректную ссылку YouTube, RUTUBE или VK Видео");
      return;
    }
    setSaving(true);
    try {
      const computedTitle = makeCarDisplayTitle(
        title,
        brand,
        model,
        year ? parseInt(year, 10) : null,
      );
      const baseSlug = makeCarSlug(brand, model, year ? parseInt(year, 10) : null);
      const slug = await ensureUniqueCarSlug(baseSlug, car.id);
      const { error } = await supabase
        .from("cars")
        .update({
          title: computedTitle,
          slug,
          brand: brand.trim(),
          model: model.trim(),
          year: year ? parseInt(year, 10) : null,
          engine_volume: engine ? parseFloat(engine) : null,
          power_hp: power ? parseInt(power, 10) : null,
          transmission: transmission || null,
          fuel: fuel || null,
          mileage_km: mileage ? parseInt(mileage, 10) : null,
          price: price ? parseFloat(price) : null,
          currency,
          country,
          status,
          description: description || null,
          auction_sheet_url: auctionUrl || null,
          video_url: normalizedVideoUrl,
          sort_order: parseInt(sortOrder, 10) || 0,
        })
        .eq("id", car.id);
      if (error) throw error;
      toast.success("Сохранено");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить автомобиль");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !car) return;
    const selectedFiles = Array.from(files);
    try {
      selectedFiles.forEach(validateCarPhoto);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось проверить фотографии");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const startOrder = photos.length;
      const hasCover = photos.some((p) => p.is_cover);
      let i = 0;
      for (const file of selectedFiles) {
        const key = await uploadCarPhoto(car.id, file);
        const { error } = await supabase.from("car_photos").insert({
          car_id: car.id,
          url: key,
          sort_order: startOrder + i,
          is_cover: !hasCover && i === 0 && startOrder === 0,
        });
        if (error) {
          await deleteCarPhotoFromStorage(key);
          throw error;
        }
        i += 1;
      }
      toast.success(`Загружено: ${i}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить фотографии");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setCover = async (photoId: string) => {
    if (!car) return;
    await supabase.from("car_photos").update({ is_cover: false }).eq("car_id", car.id);
    const { error } = await supabase.from("car_photos").update({ is_cover: true }).eq("id", photoId);
    if (error) return toast.error(error.message);
    load();
  };

  const deletePhoto = async (photo: PhotoUI) => {
    if (!confirm("Удалить фото?")) return;
    const { error } = await supabase.from("car_photos").delete().eq("id", photo.id);
    if (error) return toast.error(error.message);
    try {
      await deleteCarPhotoFromStorage(photo.url);
    } catch {
      toast.warning("Фото удалено из карточки, но файл не удалось очистить");
    }
    load();
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = photos.findIndex((p) => p.id === active.id);
    const newIdx = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, oldIdx, newIdx);
    setPhotos(next);
    await Promise.all(
      next.map((p, idx) => supabase.from("car_photos").update({ sort_order: idx }).eq("id", p.id))
    );
  };

  const remove = async () => {
    if (!car) return;
    const displayTitle = makeCarDisplayTitle(car.title, car.brand, car.model, car.year);
    if (!confirm(`Удалить «${displayTitle}»?`)) return;
    const keys = photos
      .filter((p) => !/^https?:\/\//.test(p.url) && !p.url.startsWith("/"))
      .map((p) => p.url);
    const { error } = await supabase.from("cars").delete().eq("id", car.id);
    if (error) return toast.error(error.message);
    if (keys.length) {
      const { error: cleanupError } = await supabase.storage.from("cars").remove(keys);
      if (cleanupError) {
        toast.warning("Карточка удалена, но не все файлы удалось очистить");
      }
    }
    toast.success("Удалено");
    navigate("/admin/cars");
  };

  if (loading || !car)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-5xl">
      <Link
        to="/admin/cars"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> К списку
      </Link>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold truncate">
          {brand.trim() || model.trim()
            ? <>{brand} {model} {year && <span className="text-muted-foreground">{year}</span>}</>
            : "Новый автомобиль"}
        </h1>
        <div className="flex gap-2">
          {car.status !== "draft" && (
            <Button variant="outline" asChild>
              <Link to={`/cars/${car.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-1" /> Открыть
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={remove} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Удалить
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Сохранить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Марка *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={50} />
            </div>
            <div>
              <Label>Модель *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} maxLength={80} />
            </div>
          </div>
          <div>
            <Label>Заголовок (можно оставить пустым)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${brand} ${model} ${year}`.trim()}
              maxLength={150}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Год</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <Label>Объём (л)</Label>
              <Input
                type="number"
                step="0.1"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
              />
            </div>
            <div>
              <Label>Мощность (л.с.)</Label>
              <Input type="number" value={power} onChange={(e) => setPower(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Топливо</Label>
              <Select value={fuel || "none"} onValueChange={(v) => setFuel(v === "none" ? "" : (v as CarFuel))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {Object.entries(CAR_FUEL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>КПП</Label>
              <Select
                value={transmission || "none"}
                onValueChange={(v) => setTransmission(v === "none" ? "" : (v as CarTransmission))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {Object.entries(CAR_TRANSMISSION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Пробег (км)</Label>
            <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Цена</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">₽ RUB</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="JPY">¥ JPY</SelectItem>
                  <SelectItem value="KRW">₩ KRW</SelectItem>
                  <SelectItem value="CNY">¥ CNY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Страна</Label>
              <Select value={country} onValueChange={(v) => setCountry(v as CarCountry)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAR_COUNTRY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CarStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAR_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Порядок (больше — выше)</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div>
            <Label>Ссылка на аукционный лист</Label>
            <Input
              value={auctionUrl}
              onChange={(e) => setAuctionUrl(e.target.value)}
              placeholder="https://..."
              maxLength={500}
            />
          </div>
          <div>
            <Label htmlFor="car-video-url">Видео автомобиля</Label>
            <Input
              id="car-video-url"
              type="url"
              inputMode="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              maxLength={1000}
              aria-invalid={videoUrlIsInvalid}
              aria-describedby="car-video-help"
            />
            <p
              id="car-video-help"
              className={`mt-1 text-xs ${
                videoUrlIsInvalid
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {videoUrlIsInvalid
                ? "Ссылка не распознана. Поддерживаются YouTube, RUTUBE и VK Видео."
                : "Вставьте ссылку на ролик — код iframe вставлять не нужно."}
            </p>
            {videoPreview && (
              <CarVideo
                url={videoUrl}
                title={`Предпросмотр видео ${brand} ${model}`.trim()}
                className="mt-3"
              />
            )}
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Фотографии ({photos.length})</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Загрузить
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
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
                      key={p.id}
                      photo={p}
                      onCover={() => setCover(p.id)}
                      onDelete={() => deletePhoto(p)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG или WebP до 10 МБ. Перетащите фото, чтобы изменить порядок. Звёздочка — сделать
            обложкой.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCarEdit;
