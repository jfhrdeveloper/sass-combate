"use client";

import { useEffect } from "react";

export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const alta = navigator.serviceWorker.register("/sw.js");
    alta.catch(() => {
      // Sin service worker la app sigue funcionando; solo pierde el arranque sin señal.
    });
  }, []);

  return null;
}
