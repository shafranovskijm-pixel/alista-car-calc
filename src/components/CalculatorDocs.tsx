import { BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const cellClass = "px-3 py-2 text-sm";
const headClass = "px-3 py-2 text-sm font-semibold text-foreground bg-secondary/50";
const rowEven = "even:bg-secondary/30";

const CalculatorDocs = () => (
  <section className="mt-12">
    <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
      <BookOpen className="h-5 w-5 text-primary" />
      Методика расчёта и нормативная база
    </h2>

    <div className="rounded-xl border border-border/50 bg-card">
      <Accordion type="multiple" className="w-full">
        {/* 1. Customs Duty */}
        <AccordionItem value="duty" className="border-border/50 px-6">
          <AccordionTrigger className="text-foreground font-semibold hover:no-underline">
            1. Таможенная пошлина
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Основание:</strong> Единый таможенный тариф ЕАЭС (ЕТТ ЕАЭС), коды ТН ВЭД 8703 (легковые автомобили).
            </p>

            <div>
              <p className="font-semibold text-foreground mb-2">Физические лица (для личного пользования)</p>
              <p className="mb-2">Пошлина рассчитывается как <strong className="text-foreground">наибольшее</strong> из двух значений: процент от стоимости <em>или</em> фиксированная ставка за 1 см³ объёма двигателя (в евро).</p>

              <p className="font-medium text-foreground mt-3 mb-1">Автомобили до 3 лет:</p>
              <div className="overflow-auto rounded-lg border border-border/50">
                <table className="w-full text-left">
                  <thead><tr>
                    <th className={headClass}>Стоимость (€)</th>
                    <th className={headClass}>% от стоимости</th>
                    <th className={headClass}>Мин. €/см³</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["до 8 500", "54%", "2,5"],
                      ["8 500 – 16 700", "48%", "3,5"],
                      ["16 700 – 42 300", "48%", "5,5"],
                      ["42 300 – 84 500", "48%", "7,5"],
                      ["84 500 – 169 000", "48%", "15,0"],
                      ["свыше 169 000", "48%", "20,0"],
                    ].map(([range, pct, min], i) => (
                      <tr key={i} className={rowEven}>
                        <td className={cellClass}>{range}</td>
                        <td className={cellClass}>{pct}</td>
                        <td className={cellClass}>{min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="font-medium text-foreground mt-4 mb-1">Автомобили 3–5 лет (€/см³):</p>
              <div className="overflow-auto rounded-lg border border-border/50">
                <table className="w-full text-left">
                  <thead><tr>
                    <th className={headClass}>Объём двигателя</th>
                    <th className={headClass}>€/см³</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["до 1 000", "1,5"],
                      ["1 000 – 1 500", "1,7"],
                      ["1 500 – 1 800", "2,5"],
                      ["1 800 – 2 300", "2,7"],
                      ["2 300 – 3 000", "3,0"],
                      ["свыше 3 000", "3,6"],
                    ].map(([vol, rate], i) => (
                      <tr key={i} className={rowEven}>
                        <td className={cellClass}>{vol}</td>
                        <td className={cellClass}>{rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="font-medium text-foreground mt-4 mb-1">Автомобили старше 5 лет (€/см³):</p>
              <div className="overflow-auto rounded-lg border border-border/50">
                <table className="w-full text-left">
                  <thead><tr>
                    <th className={headClass}>Объём двигателя</th>
                    <th className={headClass}>€/см³</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["до 1 000", "3,0"],
                      ["1 000 – 1 500", "3,2"],
                      ["1 500 – 1 800", "3,5"],
                      ["1 800 – 2 300", "4,8"],
                      ["2 300 – 3 000", "5,0"],
                      ["свыше 3 000", "5,7"],
                    ].map(([vol, rate], i) => (
                      <tr key={i} className={rowEven}>
                        <td className={cellClass}>{vol}</td>
                        <td className={cellClass}>{rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Юридические лица</p>
              <p>
                Ставка 15% (до 3 лет) или 20% (3–5 лет) от таможенной стоимости, но не менее специфической составляющей в €/см³. Для автомобилей старше 5 лет — только специфическая ставка (1,4–3,2 €/см³ в зависимости от объёма).
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Excise */}
        <AccordionItem value="excise" className="border-border/50 px-6">
          <AccordionTrigger className="text-foreground font-semibold hover:no-underline">
            2. Акцизный сбор
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Основание:</strong> Налоговый кодекс РФ, ст. 193, в ред. ФЗ № 425-ФЗ. Ставки на 2026 год.
            </p>
            <p>
              <strong className="text-foreground">Формула:</strong> Мощность (л.с.) × Ставка (₽/л.с.)
            </p>
            <p className="text-sm">
              ⚠️ Физические лица, ввозящие автомобиль для личного пользования, <strong className="text-foreground">освобождены</strong> от уплаты акциза.
            </p>

            <div className="overflow-auto rounded-lg border border-border/50">
              <table className="w-full text-left">
                <thead><tr>
                  <th className={headClass}>Мощность (л.с.)</th>
                  <th className={headClass}>Ставка (₽/л.с.)</th>
                </tr></thead>
                <tbody>
                  {[
                    ["до 90", "0 (не облагается)"],
                    ["90 – 150", "64"],
                    ["150 – 200", "613"],
                    ["200 – 300", "1 004"],
                    ["300 – 400", "1 564"],
                    ["400 – 500", "1 621"],
                    ["свыше 500", "1 678"],
                  ].map(([hp, rate], i) => (
                    <tr key={i} className={rowEven}>
                      <td className={cellClass}>{hp}</td>
                      <td className={cellClass}>{rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. VAT */}
        <AccordionItem value="vat" className="border-border/50 px-6">
          <AccordionTrigger className="text-foreground font-semibold hover:no-underline">
            3. НДС (налог на добавленную стоимость)
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-3">
            <p>
              <strong className="text-foreground">Основание:</strong> Налоговый кодекс РФ, гл. 21, в ред. ФЗ № 425-ФЗ. С 01.01.2026 ставка НДС — <strong className="text-foreground">22%</strong>.
            </p>
            <p>
              <strong className="text-foreground">Формула:</strong>{" "}
              <code className="rounded bg-secondary px-2 py-0.5 text-sm text-foreground">
                НДС = (Таможенная стоимость + Пошлина + Акциз) × 22%
              </code>
            </p>
            <p className="text-sm">
              ⚠️ Физические лица, ввозящие автомобиль для личного пользования, <strong className="text-foreground">освобождены</strong> от уплаты НДС. Таможенная пошлина для физлиц уже включает совокупный платёж.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Recycling Fee */}
        <AccordionItem value="recycling" className="border-border/50 px-6">
          <AccordionTrigger className="text-foreground font-semibold hover:no-underline">
            4. Утилизационный сбор
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Основание:</strong> Постановление Правительства РФ № 1291 в редакции Постановления № 1713 (действует с 01.12.2025).
            </p>
            <p>
              <strong className="text-foreground">Формула:</strong>{" "}
              <code className="rounded bg-secondary px-2 py-0.5 text-sm text-foreground">
                Утиль. сбор = Базовая ставка × Коэффициент
              </code>
            </p>
            <p>
              Базовые ставки: <strong className="text-foreground">20 000 ₽</strong> (легковые, мотоциклы) и <strong className="text-foreground">150 000 ₽</strong> (грузовики, автобусы).
            </p>

            <p className="font-medium text-foreground mb-1">Коэффициенты для легковых автомобилей (ДВС/гибрид):</p>
            <div className="overflow-auto rounded-lg border border-border/50">
              <table className="w-full text-left">
                <thead><tr>
                  <th className={headClass}>Объём двигателя</th>
                  <th className={headClass}>Новые (до 5 лет)</th>
                  <th className={headClass}>Старше 5 лет</th>
                </tr></thead>
                <tbody>
                  {[
                    ["до 1 000 см³", "4,06", "10,36"],
                    ["1 000 – 1 500", "15,69", "24,38"],
                    ["1 500 – 2 000", "33,37", "47,15"],
                    ["2 000 – 2 500", "37,41", "60,06"],
                    ["2 500 – 3 000", "42,24", "74,25"],
                    ["3 000 – 3 500", "60,06", "81,89"],
                    ["свыше 3 500", "74,25", "105,58"],
                  ].map(([vol, newK, oldK], i) => (
                    <tr key={i} className={rowEven}>
                      <td className={cellClass}>{vol}</td>
                      <td className={cellClass}>{newK}</td>
                      <td className={cellClass}>{oldK}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="font-medium text-foreground mt-3 mb-1">Коэффициенты для электромобилей (по мощности в кВт):</p>
            <div className="overflow-auto rounded-lg border border-border/50">
              <table className="w-full text-left">
                <thead><tr>
                  <th className={headClass}>Мощность (кВт)</th>
                  <th className={headClass}>Новые</th>
                  <th className={headClass}>Старше 5 лет</th>
                </tr></thead>
                <tbody>
                  {[
                    ["до 90", "2,41", "8,26"],
                    ["90 – 150", "8,86", "24,38"],
                    ["150 – 200", "12,56", "33,95"],
                    ["свыше 200", "22,25", "55,02"],
                  ].map(([kw, newK, oldK], i) => (
                    <tr key={i} className={rowEven}>
                      <td className={cellClass}>{kw}</td>
                      <td className={cellClass}>{newK}</td>
                      <td className={cellClass}>{oldK}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Customs Fee */}
        <AccordionItem value="fee" className="border-border/50 px-6">
          <AccordionTrigger className="text-foreground font-semibold hover:no-underline">
            5. Таможенный сбор за оформление
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Основание:</strong> Постановление Правительства РФ № 1637 (действует с 01.01.2025).
            </p>
            <p>Фиксированная сумма, зависящая от таможенной стоимости товара:</p>

            <div className="overflow-auto rounded-lg border border-border/50">
              <table className="w-full text-left">
                <thead><tr>
                  <th className={headClass}>Таможенная стоимость (₽)</th>
                  <th className={headClass}>Сбор (₽)</th>
                </tr></thead>
                <tbody>
                  {[
                    ["до 200 000", "775"],
                    ["200 000 – 450 000", "1 550"],
                    ["450 000 – 1 200 000", "3 100"],
                    ["1 200 000 – 2 700 000", "8 530"],
                    ["2 700 000 – 4 200 000", "12 000"],
                    ["4 200 000 – 5 500 000", "15 500"],
                    ["5 500 000 – 7 000 000", "20 000"],
                    ["7 000 000 – 8 000 000", "23 000"],
                    ["8 000 000 – 9 000 000", "25 000"],
                    ["9 000 000 – 10 000 000", "27 000"],
                    ["свыше 10 000 000", "30 000"],
                  ].map(([range, fee], i) => (
                    <tr key={i} className={rowEven}>
                      <td className={cellClass}>{range}</td>
                      <td className={cellClass}>{fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </section>
);

export default CalculatorDocs;
