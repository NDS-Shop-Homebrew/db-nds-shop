import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SafeImgProps {
  src?: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  fallback?: React.ReactNode;
}

export default function SafeImg({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  fallback,
}: SafeImgProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground ${wrapperClassName || "w-full h-full"}`}
      >
        {fallback ?? <ImageIcon size={28} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}