// components/ui/toaster.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export default function Toaster() {
  const [toasts, setToasts] = React.useState<string[]>([]);

  // simple example toast function
  const addToast = (message: string) => {
    setToasts((prev) => [...prev, message]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  // attach to window for testing
  React.useEffect(() => {
    (window as any).addToast = addToast;
  }, []);

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 9999,
      }}
    >
      {toasts.map((t, i) => (
        <div
          key={i}
          style={{
            background: "#333",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "5px",
          }}
        >
          {t}
        </div>
      ))}
    </div>,
    document.body
  );
}
