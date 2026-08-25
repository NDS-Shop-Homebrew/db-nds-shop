import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, ListOrdered } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";

interface Section {
  title: string;
  steps: string[];
}

export default function Tutorial() {
  const { t } = useTranslation();
  usePageMeta(t("tutorial.title") + " — NDS-Shop");

  const sections = t("tutorial.sections", { returnObjects: true }) as Section[];
  const emptyLabel = t("tutorial.empty_step");

  return (
    <div>
      <section className="dsi-gradient">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("tutorial.title")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">{t("tutorial.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {Array.isArray(sections) && sections.map((section, i) => (
          <div key={section.title} className="rounded-xl bg-card border border-border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ListOrdered size={20} className="text-primary" />
              {i + 1}. {section.title}
            </h2>
            <ol className="space-y-4">
              {section.steps.map((step, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {j + 1}
                  </span>
                  {step ? (
                    <p className="text-muted-foreground leading-relaxed">{step}</p>
                  ) : (
                    <p className="text-muted-foreground/50 italic">{emptyLabel}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}