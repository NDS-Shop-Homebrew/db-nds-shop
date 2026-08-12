import { Card, CardContent } from "../components/ui/card";
import { FileText, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Dmca() {
  const { t } = useTranslation();

  const sections = [
    { id: "compliance", title: t("dmca.compliance.title") },
    { id: "notification", title: t("dmca.notification.title") },
    { id: "counter", title: t("dmca.counter.title") },
    { id: "filing", title: t("dmca.filing.title") },
    { id: "repeat", title: t("dmca.repeat.title") },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">{t("dmca.title")}</h1>
        <p className="text-muted-foreground">{t("dmca.subtitle")}</p>
      </div>

      <Card className="bg-muted/40 border-border">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-3">{t("dmca.tableOfContents")}</h2>
          <div className="flex flex-wrap gap-2">
            {sections.map((section, i) => (
              <a
                key={i}
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
        {sections.map((section, i) => (
          <Card key={i} id={section.id} className="scroll-mt-24">
            <CardContent className="space-y-3 p-6">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>

              {section.id === "compliance" && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("dmca.compliance.content")}
                  </p>
                  <p className="font-medium text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {t("dmca.compliance.important")}
                  </p>
                </>
              )}

              {section.id === "notification" && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("dmca.notification.description")}
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                    {(t("dmca.notification.items", { returnObjects: true }) as string[]).map((item, j) => (
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
                    {(t("dmca.counter.items", { returnObjects: true }) as string[]).map((item, j) => (
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
                  <p className="font-medium text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {t("dmca.filing.content2")}
                  </p>
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
  );
}
