import Link from "next/link";
import React from "react";
import { IconType } from "react-icons";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import clsx from "clsx";

interface LinkItemProps {
  label: string;
  // slug?: string;
  isFocus?: boolean;
  href: string;
  isParent?: boolean;
  isOpen?: boolean;
  icon: IconType | null | undefined;
  handleClick?: (e: any) => void;
}

const LinkItem: React.FC<LinkItemProps> = ({
  label,
  isFocus,
  href,
  isParent,
  isOpen,
  icon: Icon,
  handleClick,
}) => {
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          `
          group relative 
          flex 
          items-center
          gap-2.5 
          rounded-sm 
          py-1 
          px-4 
          font-medium
          duration-300
          ease-in-out 
          `,
          isFocus
            ? "text-bodydark2 dark:text-white"
            : "text-graydark dark:text-bodydark2"
        )}
        onClick={handleClick}
      >
        {Icon && <Icon size={20} />}
        {label}
        {isParent &&
          (isOpen ? (
            <MdKeyboardArrowUp size={20} />
          ) : (
            <MdKeyboardArrowDown size={20} />
          ))}
      </Link>
    </li>
  );
};

export default LinkItem;
