import { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SafeImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
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
  loading = "lazy",
  decoding = "async",
  ...props
}: SafeImgProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground ${
          wrapperClassName || "w-full h-full"
        }`}
      >
        {fallback ?? <ImageIcon className="size-6 opacity-40" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}