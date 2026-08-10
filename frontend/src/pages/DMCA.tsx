import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useTranslation } from "../../node_modules/react-i18next";

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-600">
        {t("dmca.title")}
      </h1>
      <p className="text-center text-gray-700 dark:text-gray-300">
        {t("dmca.subtitle")}
      </p>

      <Separator className="my-4" />

      {/* Table of Contents */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent>
          <h2 className="text-xl font-semibold">{t("dmca.tableOfContents")}</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {sections.map((section, i) => (
              <li key={i}>
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

      {/* Sections */}
      {sections.map((section, i) => (
        <Card key={i}>
          <CardContent className="space-y-2" id={section.id}>
            <h2 className="text-lg font-semibold">{section.title}</h2>

            {section.id === "compliance" && (
              <>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("dmca.compliance.content")}
                </p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  {t("dmca.compliance.important")}
                </p>
              </>
            )}

            {section.id === "notification" && (
              <>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("dmca.notification.description")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {(
                    t("dmca.notification.items", {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {section.id === "counter" && (
              <>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("dmca.counter.description")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {(
                    t("dmca.counter.items", { returnObjects: true }) as string[]
                  ).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {section.id === "filing" && (
              <>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("dmca.filing.content1")}
                </p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  {t("dmca.filing.content2")}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("dmca.filing.content3")}
                </p>
              </>
            )}

            {section.id === "repeat" && (
              <p className="text-gray-700 dark:text-gray-300">
                {t("dmca.repeat.content")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
