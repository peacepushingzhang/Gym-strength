"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, title, eyebrow, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-scrim" aria-label="关闭" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={19} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
