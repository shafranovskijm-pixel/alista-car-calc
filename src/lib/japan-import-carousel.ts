const MEDIA_PATH = "/media/japan-import-guide";

export const CAROUSEL_DOWNLOADS = {
  package: `${MEDIA_PATH}/ALISTA-Instagram-carousel.zip`,
  caption: `${MEDIA_PATH}/caption.txt`,
} as const;

export const JAPAN_IMPORT_CARDS = [
  { stem: "01-cover", title: "Как привезти авто из Японии с ALISTA", description: "Девять понятных шагов: от первого обращения до передачи ключей." },
  { stem: "02-request-selection", title: "Заявка и подбор", description: "Шаги 1–2. Обращаетесь в ALISTA и заказываете подбор автомобиля." },
  { stem: "03-contract-estimate", title: "Договор и смета", description: "Шаги 3–4. Заключаем договор, выбираем автомобиль и согласовываем сумму с расходами." },
  { stem: "04-sea-transport", title: "Готовим авто к морскому пути", description: "Шаг 5. Автомобиль находится на ярде — площадке ожидания погрузки на морской транспорт." },
  { stem: "05-warehouse-customs", title: "СВХ и таможня", description: "Шаги 6–7. Выгрузка на склад временного хранения и таможенное оформление." },
  { stem: "06-release-laboratory", title: "Выпуск и лаборатория", description: "Шаг 8. После выпуска принимаем автомобиль со склада и проходим лабораторию." },
  { stem: "07-handover", title: "Ваш автомобиль — у вас", description: "Шаг 9. Передаём автомобиль и ключи клиенту или отправляем через транспортную компанию." },
  { stem: "08-contacts", title: "Начните с понятного расчёта", description: "Оставьте параметры автомобиля. Специалист проверит данные и подготовит предварительную смету." },
].map((card, index) => ({
  ...card,
  number: String(index + 1).padStart(2, "0"),
  preview: `${MEDIA_PATH}/${card.stem}.webp`,
  original: `${MEDIA_PATH}/${card.stem}.png`,
}));

export const JAPAN_IMPORT_CAPTION = `Как автомобиль из Японии становится вашим? 🚘

Листайте карусель: показываем путь от обращения и подбора до договора, согласования автомобиля и расходов, морской перевозки, таможенного оформления и передачи ключей.

После выпуска — приёмка со склада и лаборатория. Затем передаём автомобиль клиенту или отправляем через транспортную компанию.

Хотите обсудить свой вариант? Напишите @alistaavto или оставьте заявку на alistaru.ru. Специалист проверит параметры автомобиля и документы, затем подготовит предварительный расчёт.

☎ +7 914 073-01-96
Telegram: @alistaavto25

Сохраните этот маршрут, чтобы понимать, что происходит на каждом этапе.

Иллюстрации показывают этапы покупки, а не фотографии конкретных доставленных автомобилей.

#ALISTA #Алиста #АвтоИзЯпонии #АвтоПодЗаказ #Владивосток`;

export const loadCarouselShareFiles = async (signal?: AbortSignal): Promise<File[]> =>
  Promise.all(JAPAN_IMPORT_CARDS.map(async (card) => {
    const response = await fetch(card.original, { signal, credentials: "omit" });
    if (!response.ok) throw new Error(`Не удалось загрузить карточку ${card.number}`);
    const blob = await response.blob();
    // A missing static asset may resolve to the SPA HTML page with HTTP 200.
    if (blob.type !== "image/png" || blob.size === 0) {
      throw new Error(`Не удалось загрузить изображение карточки ${card.number}`);
    }
    return new File([blob], `${card.stem}.png`, { type: "image/png" });
  }));

export const isShareCancelled = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";
