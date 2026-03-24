import { motion } from "framer-motion";
import { Building2, MapPin, FileText, Users } from "lucide-react";
import Layout from "@/components/Layout";

const AboutPage = () => {
  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">О компании</h1>
          </motion.div>

          <div className="mt-12 space-y-8">
            {/* Main info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border/50 bg-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground">ООО «Алиста»</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Компания «Алиста» специализируется на профессиональном таможенном оформлении автомобилей
                и спецтехники во Владивостоке. Мы обеспечиваем полное сопровождение процесса растаможки —
                от расчёта таможенных платежей до получения готовых документов.
              </p>
            </motion.div>

            {/* Details */}
            <div className="grid gap-6 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border/50 bg-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-foreground">Реквизиты</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><span className="text-foreground font-medium">ИНН:</span> 2543194698</p>
                  <p><span className="text-foreground font-medium">КПП:</span> 254301001</p>
                  <p><span className="text-foreground font-medium">Форма:</span> Общество с ограниченной ответственностью</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border/50 bg-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-foreground">Адрес</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  690911, Приморский край, г. Владивосток, Океанский проспект, д. 136, кв. 84
                </p>
              </motion.div>
            </div>

            {/* Work hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-border/50 bg-card p-6"
            >
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Режим работы</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex justify-between rounded-md bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Понедельник — Пятница</span>
                  <span className="text-sm font-semibold text-primary">9:00 — 18:00</span>
                </div>
                <div className="flex justify-between rounded-md bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Суббота — Воскресенье</span>
                  <span className="text-sm font-semibold text-destructive">Выходной</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
