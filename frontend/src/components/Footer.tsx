import { useTranslation } from "../../node_modules/react-i18next";
import {
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  Gavel as DMCAIcon,
  PrivacyTip as PrivacyIcon,
} from "@mui/icons-material";

export default function Footer() {
  const version = import.meta.env.VITE_APP_VERSION || "dev";
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-700 px-6 py-8 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="text-center md:text-left">
          <span className="text-2xl font-bold tracking-tight select-none">
            NDS-Shop
          </span>
          <p className="mt-2 text-sm text-gray-400 select-none">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>

        <div className="flex gap-6 mt-4 justify-center w-full">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            <TwitterIcon fontSize="large" />
          </a>
          <a
            href="https://github.com/TheRinzler65"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200 transition-colors"
          >
            <GitHubIcon fontSize="large" />
          </a>
          <a
            href="/privacy"
            className="hover:text-green-400 transition-colors"
            title={t("footer.privacyPolicy")}
          >
            <PrivacyIcon fontSize="large" />
          </a>
          <a
            href="/dmca"
            className="hover:text-red-400 transition-colors"
            title={t("footer.dmca")}
          >
            <DMCAIcon fontSize="large" />
          </a>
        </div>

        <div className="text-center md:text-right text-gray-400 text-xs select-none flex flex-col md:flex-row md:items-center gap-2">
          <div>
            <p
              dangerouslySetInnerHTML={{
                __html: t("footer.developedBy", {
                  author: `<a href="http://github.com/TheRinzler65" target="_blank" rel="noreferrer" class="underline hover:text-indigo-300">Rinzler</a>`,
                }),
              }}
            />
            <p className="mt-1">
              {t("footer.version")} {version}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
