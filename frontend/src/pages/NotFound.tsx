import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  const { t } = useTranslation();
  usePageMeta("404 — NDS-Shop");

  return (
    <div>
      <section className="dsi-gradient">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl md:text-8xl font-extrabold mb-4 select-none">
              {t("notFound.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-2">
              {t("notFound.message")}
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("notFound.description")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Button asChild size="lg" className="font-semibold">
          <Link to="/">
            {t("notFound.backHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}