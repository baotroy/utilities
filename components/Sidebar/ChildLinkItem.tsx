import Link from "next/link";
import React from "react";
import { IconType } from "react-icons";
import convertCase, { CaseType } from "@/app/string/utils";

export interface ChildLinkItemProps {
  label: string;
  // slug?: string;
  href: string;
  icon?: IconType;
  currentPathname?: string;
}

const ChildLinkItem: React.FC<ChildLinkItemProps> = ({
  label,
  href,
  // icon,
  currentPathname,
}) => {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-2.5 rounded-md px-4 py-1 text-base lg:text-sm font-medium duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-meta-4 ${currentPathname === href ? "text-primary bg-primary/10" : "text-gray-600 dark:text-bodydark2"
        } `}
    >
      {convertCase(label, CaseType.Title)}
    </Link>
  );
};

export default ChildLinkItem;
