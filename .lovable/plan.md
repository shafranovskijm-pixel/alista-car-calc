
## Что делаем

Берём ваш «Япония БУШИДО ГРУПП ЛЛС (с таможней).docx», переделываем под бренд **Алиста** (логотип, реквизиты Агента) и подключаем автогенерацию персонального договора по каждому клиенту/сделке. Карточка клиента-юрлица получает поля КПП/ОГРН/юр. адрес/руководитель и кнопку «Синхронизировать» по ИНН через DaData.

## 1. Логотип и брендинг шаблона

- Генерируем логотип **Алиста** (минималистичный, в стиле текущего сайта: тёмный фон, неоновый акцент) → загружаем в Lovable Assets.
- Создаём docx-шаблон `Алиста — Агентский договор (с таможней).docx` в `public/templates/` на основе вашего файла:
  - заменяем шапки «BUSHIDO GROUP LLC» → логотип Алисты,
  - в разделе «АГЕНТ» вставляем реквизиты ООО «Алиста» (ИНН/ОГРН/адрес из @company-details),
  - блок «Принципал» — плейсхолдеры docxtemplater.
- Параллельно сохраняем тот же договор как **текстовый шаблон** (для существующего «Печать/PDF»-флоу и предпросмотра в админке).

## 2. Плейсхолдеры в шаблоне

Единый словарь подстановок (docxtemplater + текстовый предпросмотр):

```text
{contract_no} {contract_date} {city}
— Принципал-физлицо —
{principal_full_name} {principal_birth_date}
{principal_passport_series} {principal_passport_number}
{principal_passport_issued_by} {principal_passport_issued_date}
{principal_address} {principal_phone} {principal_email}
— Принципал-юрлицо (если выбрано) —
{principal_company_name} {principal_inn} {principal_kpp} {principal_ogrn}
{principal_legal_address} {principal_director_name} {principal_director_position}
— Сделка —
{car_brand} {car_model} {car_year} {car_vin}
{deal_budget} {sale_price} {currency} {commission}
```

В тексте договора (стр. 1 и стр. 15 «реквизиты сторон») делаем два варианта блока через условия docxtemplater: `{#is_company}…{/is_company}` и `{#is_individual}…{/is_individual}` — пользователь выбирает тип при генерации.

## 3. Расширение карточки клиента

Миграция БД — добавляем в `clients`:
- `kpp text`, `ogrn text`, `director_name text`, `director_position text`,
- `birth_date date`, `passport_issued_by text`, `passport_issued_date date`.

UI (новый `src/components/admin/ClientRequisitesCard.tsx`, врезаем в `AdminClientDetail.tsx`):
- сетка как на скрине: ИНН + кнопка-лупа, КПП, ОГРН, юр. адрес, ФИО руководителя, должность, аккордеон «Контакты и описание».
- Кнопка **«Синхронизировать»** → edge-function `dadata-party` (по ИНН тянет КПП/ОГРН/адрес/руководителя из DaData Suggestions API). Потребуется секрет `DADATA_API_KEY` (попрошу добавить отдельно).
- Кнопка **«Из договора»** — позже (вне этого этапа).
- Кнопка «Сохранить изменения» апдейтит `clients`.

Для физлица показываем альтернативный набор полей (паспорт, дата рождения, кем выдан).

## 4. Генерация документа

Обновляем `src/components/admin/GenerateDocumentDialog.tsx`:
- Добавляем переключатель **Тип принципала**: физлицо/юрлицо (по умолчанию — `client_type` сделки).
- Поле «Номер договора» и «Дата» (авто-предзаполнение).
- Две кнопки:
  - **Скачать .docx** — клиентский docxtemplater (`docxtemplater` + `pizzip`) грузит шаблон из `/templates/alista-agentskiy-s-tamozhney.docx`, подставляет плейсхолдеры, отдаёт `.docx` (логотип/таблицы/нумерация страниц сохраняются — выглядит «ровно и презентабельно»).
  - **Печать / PDF** (текущее поведение) — для быстрого предпросмотра текстом.
- Расширяем выборку сделки: тянем `clients(*)` со всеми новыми полями + поля авто из `cars`.
- Сохранённый .docx опционально аплоадим в bucket `documents` и привязываем к сделке (галка «Сохранить в документы сделки»).

## 5. Шаблон в админке «Шаблоны»

В `AdminDocuments → Шаблоны` добавляем спец-запись «Агентский договор Алиста (.docx)» — отмечена иконкой, при выборе в генераторе использует docx-движок, а не plain text.

## 6. DaData edge-function

`supabase/functions/dadata-party/index.ts`:
- Принимает `{ inn }`, валидирует Zod-ом (10 или 12 цифр),
- Дёргает `https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party` с `DADATA_API_KEY`,
- Возвращает `{ name, kpp, ogrn, address, director_name, director_position }`,
- CORS + JWT-проверка.

## Технические детали

- Новые пакеты: `docxtemplater`, `pizzip`, `file-saver`.
- Шаблон хранится статически в `public/templates/…` — `fetch` на клиенте, без бэкенда.
- Логотип Алисты — отдельный PNG в Lovable Assets, встроим в шаблон как картинку через `docxtemplater-image-module-free` (или просто впишем в исходный docx один раз — статичный logo).
- Миграция `clients` + GRANT/RLS уже настроены, добавим только `ALTER TABLE`.
- Никаких сроков «X дней» — в шаблоне используем формулировку «в кратчайшие сроки» (memory rule).

## Что нужно от вас после плана

1. Подтвердить генерацию логотипа Алисты (или дать готовый файл).
2. Я попрошу добавить `DADATA_API_KEY` (бесплатно на dadata.ru, 10 000 запросов/день).
