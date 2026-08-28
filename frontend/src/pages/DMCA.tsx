import { Card, CardContent } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Dmca() {
  const { t } = useTranslation();
  usePageMeta(t("dmca.title") + " — NDS-Shop");

  const getItems = (key: string): string[] => {
    const raw = t(key, { returnObjects: true });
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is string => typeof item === "string");
  };

  const sections = [
    { id: "compliance", title: t("dmca.compliance.title") },
    { id: "notification", title: t("dmca.notification.title") },
    { id: "counter", title: t("dmca.counter.title") },
    { id: "filing", title: t("dmca.filing.title") },
    { id: "repeat", title: t("dmca.repeat.title") },
  ];

  return (
    <div>
      <section className="dsi-gradient">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              {t("dmca.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              {t("dmca.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
        <Card className="bg-muted/40 border-border">
          <CardContent className="p-5">
            <h2 className="font-semibold mb-3">{t("dmca.tableOfContents")}</h2>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-sm text-primary hover:underline px-3 py-1.5 rounded-full bg-primary/10 transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <Card key={section.id} id={section.id} className="scroll-mt-24">
              <CardContent className="flex flex-col gap-3 p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>

                {section.id === "compliance" && (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("dmca.compliance.content")}
                    </p>
                    <Alert variant="destructive">
                      <AlertDescription>
                        {t("dmca.compliance.important")}
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {section.id === "notification" && (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("dmca.notification.description")}
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                      {getItems("dmca.notification.items").map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {section.id === "counter" && (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("dmca.counter.description")}
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                      {getItems("dmca.counter.items").map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {section.id === "filing" && (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("dmca.filing.content1")}
                    </p>
                    <a
                      href={`mailto:${t("dmca.filing.mail")}`}
                      className="text-primary font-medium hover:underline inline-flex items-center gap-1.5"
                    >
                      <Mail size={14} /> {t("dmca.filing.mail")}
                    </a>
                    <Alert variant="destructive">
                      <AlertDescription>
                        {t("dmca.filing.content2")}
                      </AlertDescription>
                    </Alert>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("dmca.filing.content3")}
                    </p>
                  </>
                )}

                {section.id === "repeat" && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("dmca.repeat.content")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}