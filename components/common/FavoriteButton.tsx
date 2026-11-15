"use client";
import clsx from "clsx";
import { MdStar, MdStarBorder } from "react-icons/md";
import { toggleFavoriteTool } from "@/common/toolInfo";
import useFavoriteTools from "@/hooks/useFavoriteTools";

/** Star toggle that pins a tool to the Favorites list on the home page. */
const FavoriteButton = ({ href, size = 22, className }: { href: string; size?: number; className?: string }) => {
  const favorites = useFavoriteTools();
  const on = favorites.includes(href);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from favorites" : "Add to favorites"}
      title={on ? "Remove from favorites" : "Add to favorites"}
      onClick={(e) => {
        // the button can sit inside a card link
        e.preventDefault();
        e.stopPropagation();
        toggleFavoriteTool(href);
      }}
      className={clsx("cursor-pointer", on ? "text-amber-500" : "text-bodydark hover:text-amber-500", className)}
    >
      {on ? <MdStar size={size} /> : <MdStarBorder size={size} />}
    </button>
  );
};

export default FavoriteButton;
