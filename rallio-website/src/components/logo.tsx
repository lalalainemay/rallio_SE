import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  imageSrc?: string; // Path to logo image
  alt?: string;
}

export function Logo({
  className = "",
  size = 48,
  showText = true,
  imageSrc,
  alt = "Rallio Logo"
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex items-center justify-center bg-white rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={alt}
            width={size}
            height={size}
            className="object-cover"
          />
        ) : (
          // Placeholder SVG when no image is provided
          <svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L4 7.5V16.5L12 22L20 16.5V7.5L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#006D77]"
            />
            <path
              d="M12 8L8 10.5V15.5L12 18L16 15.5V10.5L12 8Z"
              fill="currentColor"
              className="text-[#006D77]"
            />
          </svg>
        )}
      </div>
      {showText && (
        <span className="text-white text-3xl font-bold tracking-tight">
          Rallio
        </span>
      )}
    </div>
  );
}
