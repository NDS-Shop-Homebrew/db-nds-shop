import { Card, CardContent } from "../components/ui/card";
import { Shield, Mail, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

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
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">{t("privacy.title")}</h1>
        <p className="text-muted-foreground">{t("privacy.subtitle")}</p>
      </div>

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
  );
}
