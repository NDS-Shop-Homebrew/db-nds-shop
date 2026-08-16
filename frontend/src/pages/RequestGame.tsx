import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { API_BASE_URL } from "../config";

export default function RequestGame() {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState("");
  const [systems, setSystems] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async () => {
    if (title.trim().length < 2) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE_URL}/v1/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, systems, note, lang: i18n.language }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setTitle("");
      setSystems("");
      setNote("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("request.title")}</CardTitle>
            <CardDescription>{t("request.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("request.gameLabel")}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("request.gamePlaceholder")}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("request.systemsLabel")}</label>
              <Input
                value={systems}
                onChange={(e) => setSystems(e.target.value)}
                placeholder={t("request.systemsPlaceholder")}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("request.noteLabel")}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={t("request.notePlaceholder")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={submit} disabled={status === "loading" || title.trim().length < 2}>
              <Send size={16} /> {t("request.submit")}
            </Button>
            {status === "done" && (
              <p className="text-sm text-green-600 dark:text-green-400">{t("request.done")}</p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">{t("request.error")}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}