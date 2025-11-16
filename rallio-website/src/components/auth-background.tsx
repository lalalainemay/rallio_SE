import { ReactNode } from "react";

interface AuthBackgroundProps {
  children: ReactNode;
  backgroundImage?: string; // Optional background image path
  backgroundColor?: string; // Optional background color (default: #006D77)
  overlayOpacity?: number; // Opacity of the image overlay (default: 0.3)
}

export function AuthBackground({
  children,
  backgroundImage,
  backgroundColor = "#006D77",
  overlayOpacity = 0.3,
}: AuthBackgroundProps) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor }}
    >
      {/* Background Image Overlay (if provided) */}
      {backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: overlayOpacity,
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
