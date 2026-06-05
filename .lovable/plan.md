## Что делаем

Переносим раздел «Наши работы» со статичного JSON на Supabase + добавляем админку `/admin/works`, где можно создавать, редактировать, удалять лоты и фотографии.

## База данных

**Таблица `works`** — карточка авто:
- title, slug (уникальный), price (bigint, nullable), country (Китай/Япония/Корея/др., nullable), year, brand, model, description, status (`published` / `draft`), sort_order, source_date (дата из Telegram).

**Таблица `work_photos`** — фото к лоту:
- work_id (FK на works, cascade delete), url, sort_order, is_cover.

**Bucket `works`** — публичный, для загрузки оригиналов фото из админки.

**RLS:**
- Публичный SELECT для `status='published'` (anon + authenticated).
- Полный CRUD только для пользователей с ролью `admin` или `manager` (через существующую `has_role`).

## Импорт текущих данных

Одноразовый скрипт миграции из `src/data/works.json` → таблицы `works` + `work_photos` (URLы фото остаются прежние, на CDN, ничего не перезаливаем). После импорта файл `works.json` можно удалить.

## Фронт — публичная страница `/works`

Переписываем `src/pages/Works.tsx`: вместо импорта JSON — запрос к Supabase (`works` + `work_photos`, только `published`, сортировка по `sort_order`/`source_date`). Поиск, фильтр по стране, пагинация, модалка с каруселью — сохраняем как есть.

## Фронт — админка `/admin/works`

Новый пункт в `AdminLayout` сайдбаре. Страницы:

1. **`/admin/works`** — список лотов (таблица): обложка, название, цена, страна, статус, дата. Действия: «Редактировать», «Скрыть/Опубликовать», «Удалить». Кнопка «+ Новый лот».

2. **`/admin/works/:id`** — редактор карточки:
   - Поля: title, brand, model, year, price, country, description, status, sort_order.
   - Галерея фото: drag-and-drop загрузка (multi-select), превью сеткой, выбор обложки, перетаскивание для сортировки (`@dnd-kit`), удаление.
   - Кнопки «Сохранить» / «Удалить лот».

Все мутации через клиент Supabase с учётом RLS.

## Технические детали

- Таблицы создаются миграцией с GRANT'ами для `anon` (SELECT по published) и `authenticated` (CRUD под RLS) + `service_role`.
- Триггер `updated_at`, триггер аудита (как у `leads`/`deals`).
- Bucket `works` — public, RLS на `storage.objects`: SELECT всем, INSERT/UPDATE/DELETE только admin/manager.
- Для drag-and-drop добавим зависимость `@dnd-kit/core` + `@dnd-kit/sortable`.
- Slug генерируется автоматически из title (translit), уникальность проверяется на сохранении.

## Что НЕ делаем в этой итерации

- Не делаем загрузку из Telegram-архива через UI (это разовая операция, скрипт-импорт хватит).
- Не делаем публичную страницу отдельного лота `/works/:slug` — пока всё в модалке. Можно добавить позже для SEO.

## Вопрос

Поля `brand`, `model`, `year` — отдельными колонками (удобно для будущих фильтров «по марке/году»), или хватит одного `title`? По умолчанию делаю отдельными.
