import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta ? meta.getAttribute("content") : null;
    let created = false;

    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
        created = true;
      }
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = prevTitle;
      if (created && meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta && prevDesc !== null) {
        meta.setAttribute("content", prevDesc);
      }
    };
  }, [title, description]);
}