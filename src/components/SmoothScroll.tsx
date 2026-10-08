"use client";

import { useEffect } from "react";

/** Enables smooth scrolling for anchor navigation across the app. */
export default function SmoothScroll() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";

    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!target) return;
      const id = target.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
