import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-9xl font-extrabold mb-6 select-none">{t("notFound.title")}</h1>
      <p className="text-2xl mb-4">{t("notFound.message")}</p>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        {t("notFound.description")}
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold transition"
      >
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}