"use client";
import { useEffect, useState } from "react";
import { FAVORITES_EVENT, readFavoriteTools } from "@/common/toolInfo";

/** Starred tool hrefs, kept in sync across components and tabs. */
export default function useFavoriteTools(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setList(readFavoriteTools());
    load();
    window.addEventListener(FAVORITES_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return list;
}
