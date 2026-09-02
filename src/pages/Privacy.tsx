import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";

const Privacy = () => (
  <PageTransition>
    <Layout>
      <main className="container py-12 md:py-16">
        <article className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            ООО «Алиста»
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
            Политика обработки персональных данных
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Редакция от 2 сентября 2026 года</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">1. Оператор и область действия</h2>
              <p className="mt-3">
                Оператор персональных данных — ООО «Алиста», ИНН 2543194698, КПП 254301001,
                адрес: 690911, Приморский край, г. Владивосток, Океанский проспект, д. 136,
                кв. 84. Политика применяется к данным, полученным через сайт alistaru.ru.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">2. Какие данные обрабатываются</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>имя, телефон, электронная почта (если указана) и текст обращения;</li>
                <li>интересующий автомобиль или услуга и параметры расчёта, если они переданы в форме;</li>
                <li>адрес страницы, источник перехода и рекламные метки;</li>
                <li>
                  после отдельного согласия на аналитику — сведения о посещении, устройстве,
                  браузере, действиях на страницах, а также идентификаторы cookie и localStorage,
                  используемые Яндекс Метрикой.
                </li>
              </ul>
              <p className="mt-3">
                Сайт не запрашивает специальные категории и биометрические персональные данные.
                Не указывайте такие сведения в свободном поле сообщения.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">3. Цели и основания обработки</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>принять обращение, уточнить запрос и связаться с заявителем;</li>
                <li>подготовить предварительный расчёт и предложение по услугам;</li>
                <li>вести историю обращения в CRM и контролировать качество ответа;</li>
                <li>с отдельного согласия — оценивать посещаемость и обращения для улучшения сайта.</li>
              </ul>
              <p className="mt-3">
                Основанием является согласие посетителя, выраженное отправкой формы или выбором
                «Разрешить аналитику». Обработка также может выполняться для действий по запросу
                посетителя до заключения договора и в случаях, предусмотренных законом.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">4. Порядок и срок обработки</h2>
              <p className="mt-3">
                Данные могут собираться, записываться, систематизироваться, храниться, уточняться,
                извлекаться, использоваться, предоставляться уполномоченным техническим
                исполнителям, блокироваться, удаляться и уничтожаться автоматизированным и
                неавтоматизированным способом. Они хранятся не дольше, чем это необходимо для
                указанных целей, после чего удаляются или обезличиваются, если иной срок не
                установлен законом. При отзыве согласия обработка прекращается, кроме случаев,
                когда закон разрешает продолжить её без согласия.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">5. Передача и аналитика</h2>
              <p className="mt-3">
                Для работы формы, CRM, уведомлений и хостинга оператор может привлекать
                технических исполнителей, обрабатывающих данные только для оказания этих услуг.
                Данные также предоставляются государственным органам, если этого требует закон.
              </p>
              <p className="mt-3">
                Яндекс Метрика включается только после отдельного согласия. Вебвизор отключён,
                содержимое полей формы в цели аналитики не передаётся. Яндекс обрабатывает данные
                посещений по поручению оператора на условиях
                {" "}
                <a
                  href="https://yandex.ru/legal/metrica_termsofuse/ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  соглашения Яндекс Метрики
                </a>
                {" "}и
                {" "}
                <a
                  href="https://yandex.ru/legal/confidential/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  политики конфиденциальности Яндекса
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">6. Права посетителя</h2>
              <p className="mt-3">
                Посетитель вправе запросить сведения об обработке, уточнение, блокирование или
                удаление своих данных и отозвать согласие. Для обращения используйте телефон
                {" "}
                <a href="tel:+79140730196" className="font-semibold text-primary underline underline-offset-2">
                  +7 914 073-01-96
                </a>
                {" "}или почтовый адрес оператора, указанный в разделе 1. Согласие на Метрику можно
                изменить кнопкой «Настройки аналитики» в нижней части любой публичной страницы.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">7. Защита и обновление политики</h2>
              <p className="mt-3">
                Оператор применяет правовые, организационные и технические меры, необходимые для
                защиты данных. Актуальная редакция политики постоянно доступна на этой странице;
                при изменении способов обработки она обновляется.
              </p>
            </section>
          </div>
        </article>
      </main>
    </Layout>
  </PageTransition>
);

export default Privacy;
