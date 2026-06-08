import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Package, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import {
  fetchCategories,
  fetchPublicProducts,
  resolveProductPhotoUrl,
  formatCny,
  type ProductCategory,
  type ProductWithPhotos,
} from "@/lib/products";

type Card = ProductWithPhotos & { coverUrl?: string };

const GoodsPage = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories(true),
          fetchPublicProducts(),
        ]);
        const withCovers = await Promise.all(
          prods.map(async (p) => {
            const hero = p.hero_photo_path ?? p.photos[0]?.storage_path;
            const coverUrl = hero ? await resolveProductPhotoUrl(hero) : undefined;
            return { ...p, coverUrl };
          })
        );
        if (!cancelled) {
          setCategories(cats);
          setProducts(withCovers);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (activeCat === "all") return products;
    return products.filter((p) => p.category_id === activeCat);
  }, [products, activeCat]);

  return (
    <PageTransition>
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">
                Товары из Китая
              </h1>
              <p className="mt-3 text-center text-muted-foreground">
                Запчасти, оборудование и техника под заказ — поможем подобрать поставщика и доставить во Владивосток.
              </p>
            </motion.div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button
                variant={activeCat === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCat("all")}
              >
                <Filter className="h-3.5 w-3.5 mr-1" /> Все
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant={activeCat === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>

            <div className="mt-8">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 p-12 text-center text-muted-foreground">
                  <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  Скоро здесь появятся товары. Свяжитесь с нами — подберём под ваш запрос.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => (
                    <Link
                      key={p.id}
                      to={`/goods/${p.slug}`}
                      className="group rounded-xl border border-border/50 bg-card overflow-hidden hover-lift"
                    >
                      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                        {p.coverUrl ? (
                          <img
                            src={p.coverUrl}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <div className="font-heading text-base font-semibold text-foreground line-clamp-2">
                          {p.name}
                        </div>
                        <div className="pt-2 text-lg font-bold text-primary">
                          {formatCny(p.price_cny)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </Layout>
    </PageTransition>
  );
};

export default GoodsPage;