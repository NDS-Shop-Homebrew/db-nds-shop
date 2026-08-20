import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, ListOrdered } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";

interface Section {
  title: string;
  steps: string[];
}





const SECTIONS: Section[] = [
  {
    title: "Prérequis",
    steps: [
      "Une Nintendo 3DS / 2DS (XL) avec le firmware modifié (Luma3DS via boot9strap).",
      "Une carte SD avec au moins 500 Mo d'espace libre.",
      "L'application FBI installée (elle permet de scanner le QR code pour installer le CIA).",
      "L'application Universal-Updater installée (utile pour l'étape suivante).",
      "Le QR code ou le lien de téléchargement du fichier NDS-Shop.cia.",
    ],
  },
  {
    title: "Installation",
    steps: [
      "Ouvre l'application FBI sur ta console.",
      "Va dans « Remote Install », puis « Scan QR Code ».",
      "Scanne le QR code du NDS-Shop.cia.",
      "FBI télécharge puis installe automatiquement le fichier. Confirme l'installation.",
      "Retourne au menu HOME : l'icône NDS-Shop apparaît.",
    ],
  },
  {
    title: "Installer le NDS Forwarder Pack",
    steps: [
      "Ouvre l'application Universal-Updater.",
      "Recherche le « NDS Forwarder Pack » dans la liste des logiciels.",
      "Sélectionne-le et installe-le.",
      "Ce pack permet d'afficher correctement les jeux NDS (icônes, titres) dans le menu HOME de la console.",
    ],
  },
  {
    title: "Ajouter un jeu à la console",
    steps: [
      "Ouvre l'application NDS-Shop.",
      "Parcours le catalogue ou utilise la barre de recherche pour trouver un jeu.",
      "Sélectionne le jeu, puis appuie sur « Télécharger ».",
      "Attends la fin du téléchargement.",
      "Installe le jeu (le shop gère l'installation, sinon passe par FBI).",
      "Le jeu est maintenant disponible dans le menu HOME.",
    ],
  },
  {
    title: "Résolution de problèmes",
    steps: [
      "Erreur de connexion : vérifie ta connexion internet (réseau, DNS).",
      "Téléchargement qui échoue : réessaie après avoir redémarré l'application.",
      "« Pas assez d'espace » : libère de la place sur la carte SD.",
      "L'application ne s'ouvre pas : mets à jour Luma3DS et réinstalle le CIA.",
    ],
  },
];

export default function Tutorial() {
  const { t } = useTranslation();
  usePageMeta(t("tutorial.title") + " — NDS-Shop");

  return (
    <div>
      <section className="dsi-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("tutorial.title")}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">{t("tutorial.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {SECTIONS.map((section, i) => (
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
                    <p className="text-muted-foreground/50 italic">À écrire…</p>
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