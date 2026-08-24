import { Card, CardContent } from "../components/ui/card";
import { motion } from "framer-motion";
import { Shield, Mail, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../hooks/usePageMeta";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  usePageMeta(t("privacy.title") + " — NDS-Shop");

  const sections = [
    {
      id: "dataCollection",
      title: t("privacy.dataCollection"),
      content: t("privacy.dataCollectionText"),
      items: t("privacy.dataCollectionItems", { returnObjects: true }) as string[],
    },
    {
      id: "technical",
      title: t("privacy.technical"),
      content: t("privacy.technicalText"),
      items: t("privacy.technicalItems", { returnObjects: true }) as string[],
    },
    {
      id: "thirdParty",
      title: t("privacy.thirdParty"),
      content: t("privacy.thirdPartyText"),
      items: t("privacy.thirdPartyItems", { returnObjects: true }) as string[],
    },
    {
      id: "security",
      title: t("privacy.security"),
      content: t("privacy.securityText"),
      items: t("privacy.securityItems", { returnObjects: true }) as string[],
    },
    {
      id: "contact",
      title: t("privacy.contact"),
      content: t("privacy.contactText"),
    },
    {
      id: "updates",
      title: t("privacy.updates"),
      content: t("privacy.updatesText"),
    },
  ];

  return (
    <div>
      {}
      <section className="dsi-gradient">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("privacy.title")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">{t("privacy.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <Card className="bg-muted/40 border-border">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-3">{t("privacy.tableOfContents")}</h2>
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

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id} id={section.id} className="scroll-mt-24">
            <CardContent className="space-y-3 p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.content}
              </p>
              {section.items && (
                <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="border-primary/30">
          <CardContent className="p-6 flex items-center gap-4">
            <Mail className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{t("privacy.contactText")}</p>
              <a
                href={`mailto:${t("privacy.contactMail")}`}
                className="text-primary font-medium hover:underline inline-flex items-center gap-1.5 mt-1"
              >
                <FileText size={14} /> {t("privacy.contactMail")}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
