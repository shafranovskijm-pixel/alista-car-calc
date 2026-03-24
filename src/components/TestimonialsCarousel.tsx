import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Алексей М.",
    car: "Toyota Land Cruiser 300",
    text: "Обратился в ALISTA для растаможки Land Cruiser из Японии. Всё оформили за 3 дня, объяснили каждый платёж. Рекомендую!",
  },
  {
    name: "Дмитрий К.",
    car: "Mazda CX-5",
    text: "Первый раз заказывал авто из-за границы — переживал. Ребята взяли всё на себя, от расчёта до получения ПТС. Цена совпала с калькулятором.",
  },
  {
    name: "Ирина В.",
    car: "Hyundai Tucson",
    text: "Привезли Tucson из Кореи. Весь процесс был прозрачным, менеджер на связи 24/7. Очень довольна сервисом!",
  },
  {
    name: "Сергей Л.",
    car: "Subaru Forester",
    text: "Уже второй раз обращаюсь. Качество работы на высоте, сроки соблюдают. Утилизационный сбор рассчитали точно, сюрпризов не было.",
  },
  {
    name: "Олег П.",
    car: "Nissan Patrol",
    text: "Растаможка заняла 2 дня. Оперативно, профессионально, без лишней нервотрёпки. Буду рекомендовать друзьям.",
  },
];

const TestimonialsCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    setDirection(1);
    setCurrent((p) => (p + 1) % testimonials.length);
  };
  const prev = () => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section className="relative py-20">
      <div className="container max-w-2xl">
        <h2 className="text-center font-heading text-3xl font-bold text-foreground md:text-4xl mb-12">
          Отзывы клиентов
        </h2>

        <div className="relative rounded-xl border border-border/50 bg-card p-8 md:p-10 min-h-[220px] flex flex-col justify-center">
          <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/20" />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-center"
            >
              <p className="text-base text-muted-foreground leading-relaxed md:text-lg">
                «{t.text}»
              </p>
              <div className="mt-6">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-primary">{t.car}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            aria-label="Предыдущий отзыв"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            aria-label="Следующий отзыв"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dots */}
        <div className="mt-5 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
              aria-label={`Отзыв ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
