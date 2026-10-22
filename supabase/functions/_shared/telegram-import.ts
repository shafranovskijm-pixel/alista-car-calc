// Webhook decision logic with injected storage/Telegram dependencies (unit-tested).
import { parseCarPost, redactToken, telegramSlug } from "./telegram-parse.ts";

export const MAX_PHOTOS = 20;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type TgPhotoSize = { file_id: string; file_unique_id: string; file_size?: number; width?: number; height?: number };
export type TgMessage = {
  message_id: number;
  date: number;
  edit_date?: number;
  media_group_id?: string;
  chat: { id: number; type: string };
  text?: string;
  caption?: string;
  photo?: TgPhotoSize[];
  document?: { file_id: string; file_unique_id: string; mime_type?: string; file_size?: number };
};
export type TgUpdate = { update_id: number; channel_post?: TgMessage; edited_channel_post?: TgMessage; [k: string]: unknown };

export type Settings = { enabled: boolean; channel_id: number | null };
export type PendingPhoto = { message_id: number; file_id: string; file_unique_id: string; mime_type: string | null };

export interface ImportDeps {
  isProcessed(updateId: number): Promise<boolean>;
  markProcessed(updateId: number): Promise<void>;
  saveMessage(row: { chat_id: number; message_id: number; group_key: string; file_id: string | null; file_unique_id: string | null; mime_type: string | null }): Promise<void>;
  upsertCar(groupKey: string, chatId: number, messageId: number, version: number, car: Record<string, unknown>): Promise<{ car_id: string | null; outcome: string }>;
  postCarId(groupKey: string): Promise<string | null>;
  pendingPhotos(groupKey: string): Promise<PendingPhoto[]>;
  downloadPhoto(fileId: string): Promise<{ bytes: Uint8Array; mime: string }>;
  storePhoto(path: string, bytes: Uint8Array, mime: string): Promise<void>;
  setStoragePath(chatId: number, messageId: number, path: string): Promise<void>;
  syncPhotos(groupKey: string): Promise<number>;
  log(entry: { group_key: string | null; message_id: number | null; car_id: string | null; status: string; message: string }): Promise<void>;
  touchImported(): Promise<void>;
}

export type Outcome = { status: number; body: string };

export const groupKeyOf = (m: TgMessage) =>
  m.media_group_id ? `g:${m.chat.id}:${m.media_group_id}` : `m:${m.chat.id}:${m.message_id}`;

const safeEqual = (a: string | null, b: string) => {
  if (!a || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export const authorize = (secretHeader: string | null, expectedSecret: string | null, settings: Settings | null, msg: TgMessage | undefined) => {
  if (!expectedSecret || !safeEqual(secretHeader, expectedSecret)) return "unauthorized" as const;
  if (!settings?.enabled || settings.channel_id == null) return "disabled" as const;
  if (!msg || msg.chat.type !== "channel" || msg.chat.id !== settings.channel_id) return "foreign" as const;
  return "ok" as const;
};

const photoOf = (m: TgMessage) => {
  if (m.photo?.length) {
    const largest = [...m.photo].sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))[0];
    return { file_id: largest.file_id, file_unique_id: largest.file_unique_id, mime_type: "image/jpeg" };
  }
  if (m.document?.mime_type && PHOTO_MIME[m.document.mime_type]) {
    return { file_id: m.document.file_id, file_unique_id: m.document.file_unique_id, mime_type: m.document.mime_type };
  }
  return null;
};

export const handleUpdate = async (update: TgUpdate, deps: ImportDeps): Promise<Outcome> => {
  const msg = update.channel_post ?? update.edited_channel_post;
  if (!msg) return { status: 200, body: "ignored" };
  if (await deps.isProcessed(update.update_id)) return { status: 200, body: "duplicate" };

  const chatId = msg.chat.id;
  const groupKey = groupKeyOf(msg);
  const photo = photoOf(msg);
  await deps.saveMessage({ chat_id: chatId, message_id: msg.message_id, group_key: groupKey, file_id: photo?.file_id ?? null, file_unique_id: photo?.file_unique_id ?? null, mime_type: photo?.mime_type ?? null });

  const text = msg.caption ?? msg.text;
  let carId: string | null = null;
  if (text && text.trim()) {
    const parsed = parseCarPost(text);
    if (parsed.kind === "invalid") {
      await deps.log({ group_key: groupKey, message_id: msg.message_id, car_id: null, status: "error", message: parsed.errors.join("; ") });
    } else if (parsed.kind === "ok") {
      const car = { ...parsed.car, slug: telegramSlug(parsed.car, chatId, msg.message_id) };
      const res = await deps.upsertCar(groupKey, chatId, msg.message_id, msg.edit_date ?? msg.date, car);
      carId = res.car_id;
      const labels: Record<string, string> = {
        created: `Создана карточка: ${parsed.car.title}`,
        updated: `Обновлена карточка: ${parsed.car.title}`,
        stale: "Пропущена устаревшая версия текста (уже есть более новая правка)",
        car_deleted: "Карточка была удалена на сайте — пост не восстанавливается",
      };
      await deps.log({ group_key: groupKey, message_id: msg.message_id, car_id: carId, status: res.outcome === "created" || res.outcome === "updated" ? "imported" : "skipped", message: labels[res.outcome] ?? res.outcome });
      if (res.outcome === "created" || res.outcome === "updated") await deps.touchImported();
    }
  }

  carId = carId ?? (await deps.postCarId(groupKey));
  if (carId) {
    for (const p of (await deps.pendingPhotos(groupKey)).slice(0, MAX_PHOTOS)) {
      try {
        const file = await deps.downloadPhoto(p.file_id);
        const ext = PHOTO_MIME[file.mime];
        if (!ext) throw new Error(`недопустимый тип файла ${file.mime}`);
        if (file.bytes.byteLength > MAX_PHOTO_BYTES) throw new Error("фото больше 10 МБ");
        const path = `${carId}/tg-${p.message_id}-${p.file_unique_id}.${ext}`;
        await deps.storePhoto(path, file.bytes, file.mime);
        await deps.setStoragePath(chatId, p.message_id, path);
      } catch (e) {
        await deps.log({ group_key: groupKey, message_id: p.message_id, car_id: carId, status: "error", message: redactToken(`Фото не загружено: ${e instanceof Error ? e.message : String(e)}`) });
      }
    }
    await deps.syncPhotos(groupKey);
  }

  await deps.markProcessed(update.update_id);
  return { status: 200, body: "ok" };
};
