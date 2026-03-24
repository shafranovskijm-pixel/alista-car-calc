import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import car1 from "@/assets/gallery/car1.jpg";
import car2 from "@/assets/gallery/car2.jpg";
import car3 from "@/assets/gallery/car3.jpg";
import car4 from "@/assets/gallery/car4.jpg";
import car5 from "@/assets/gallery/car5.jpg";
import car6 from "@/assets/gallery/car6.jpg";

const galleryItems = [
  { src: car1, title: "Toyota Crown", desc: "Седан, порт Владивостока" },
  { src: car2, title: "Lexus RX", desc: "Кроссовер, таможенный терминал" },
  { src: car3, title: "Mazda CX-5", desc: "Кроссовер, порт отгрузки" },
  { src: car4, title: "Nissan Skyline GT-R", desc: "Спорткар, аукцион Японии" },
  { src: car5, title: "Toyota Land Cruiser Prado", desc: "Внедорожник, контейнерный терминал" },
  { src: car6, title: "Subaru Forester", desc: "Кроссовер, зона досмотра" },
];

const Gallery = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const navigate = (dir: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + galleryItems.length) % galleryItems.length);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/50"
            onClick={() => setLightbox(i)}
          >
            <img
              src={item.src}
              alt={item.title}
              loading="lazy"
              width={800}
              height={600}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="font-heading font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              className="absolute left-4 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={galleryItems[lightbox].src}
              alt={galleryItems[lightbox].title}
              className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
              className="absolute right-4 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <div className="absolute bottom-8 text-center">
              <p className="font-heading font-semibold text-foreground">{galleryItems[lightbox].title}</p>
              <p className="text-sm text-muted-foreground">{galleryItems[lightbox].desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
