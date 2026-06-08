import { motion } from "framer-motion";
import { Phone, MessageCircle, Send, MapPin, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";
import LeadForm from "@/components/LeadForm";

const contacts = [
  { role: "Директор", name: "", phone: "+7 984 198-27-33", phoneRaw: "79841982733" },
  { role: "Бухгалтер", name: "", phone: "+7 914 703-06-91", phoneRaw: "79147030691" },
  { role: "Менеджер", name: "", phone: "+7 914 073-01-96", phoneRaw: "79140730196" },
];

const ContactsPage = () => {
  return (
    <PageTransition>
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">Контакты</h1>
            <p className="mt-3 text-center text-muted-foreground">
              Свяжитесь с нами удобным для вас способом
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Contact cards */}
            <div className="space-y-4">
              {contacts.map((c, i) => (
                <motion.div
                  key={c.role}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border/50 bg-card p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.role}</p>
                      <a href={`tel:${c.phoneRaw}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                        {c.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${c.phoneRaw}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full border-green-700/30 text-green-400 hover:bg-green-900/20 hover:text-green-300">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </Button>
                    </a>
                    <a
                      href={`https://t.me/+${c.phoneRaw}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full border-blue-700/30 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300">
                        <Send className="mr-2 h-4 w-4" />
                        Telegram
                      </Button>
                    </a>
                  </div>
                </motion.div>
              ))}

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border/50 bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Адрес</p>
                    <p className="text-sm text-muted-foreground">
                      690911, Приморский край, г. Владивосток, Океанский проспект, д. 136, кв. 84
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <Clock className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Режим работы</p>
                    <p className="text-sm text-muted-foreground">Пн-Пт: 9:00–18:00 · Сб-Вс: выходной</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-5">Оставить заявку</h2>
                <LeadForm source="contacts_page" showEmail />
              </div>

              {/* Map */}
              <div className="mt-6 rounded-xl border border-border/50 overflow-hidden">
                <iframe
                  title="Карта — ALISTA"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2943.0!2d131.9!3d43.12!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDA3JzEyLjAiTiAxMzHCsDU0JzAwLjAiRQ!5e0!3m2!1sru!2sru!4v1"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
    </PageTransition>
  );
};

export default ContactsPage;
