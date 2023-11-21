import Link from "next/link";
import React from "react";
import { IconType } from "react-icons";

export interface ChildLinkItemProps {
  label: string;
  slug?: string;
  href: string;
  icon?: IconType;
  currentPathname?: string
}

const ChildLinkItem: React.FC<ChildLinkItemProps> = ({ label, href, icon: Icon, currentPathname }) => {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
        (currentPathname === href) && "text-white"
      } `}
    >
      {label}
    </Link>
  );
};

export default ChildLinkItem;
