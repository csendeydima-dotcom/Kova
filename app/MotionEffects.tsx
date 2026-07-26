"use client";

import { useEffect } from "react";

export function MotionEffects() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (reducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));

    const preview = document.querySelector<HTMLElement>(".product-preview");
    const movePreview = (event: PointerEvent) => {
      if (!preview || event.pointerType === "touch") return;
      const rect = preview.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      preview.style.setProperty("--tilt-x", `${(-y * 2.4).toFixed(2)}deg`);
      preview.style.setProperty("--tilt-y", `${(x * 3.2).toFixed(2)}deg`);
    };
    const resetPreview = () => {
      preview?.style.setProperty("--tilt-x", "0deg");
      preview?.style.setProperty("--tilt-y", "0deg");
    };

    preview?.addEventListener("pointermove", movePreview);
    preview?.addEventListener("pointerleave", resetPreview);

    return () => {
      observer.disconnect();
      preview?.removeEventListener("pointermove", movePreview);
      preview?.removeEventListener("pointerleave", resetPreview);
    };
  }, []);

  return null;
}
