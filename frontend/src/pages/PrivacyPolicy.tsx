import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useTranslation } from "../../node_modules/react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  const sections = [
    {
      id: "dataCollection",
      title: t("privacy.dataCollection"),
      content: t("privacy.dataCollectionText"),
      items: t("privacy.dataCollectionItems", {
        returnObjects: true,
      }) as string[],
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-600">
        {t("privacy.title")}
      </h1>
      <p className="text-center text-gray-700 dark:text-gray-300">
        {t("privacy.subtitle")}
      </p>

      <Separator className="my-4" />

      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent>
          <h2 className="text-xl font-semibold">
            {t("privacy.tableOfContents")}
          </h2>
          <ul className="list-none space-y-1 text-gray-700 dark:text-gray-300">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id} id={section.id}>
            <CardContent className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {section.content}
              </p>
              {section.items && (
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
