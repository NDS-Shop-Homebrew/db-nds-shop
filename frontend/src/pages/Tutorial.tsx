import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";

export default function Tutorial() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="dsi-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("tutorial.title")}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">
              {t("tutorial.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="rounded-xl bg-card border border-border p-8 shadow-sm">
          <p className="text-muted-foreground leading-relaxed">
            {t("tutorial.coming_soon")}
          </p>
        </div>
      </div>
    </div>
  );
}