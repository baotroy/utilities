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
      className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
        currentPathname === href && "text-white"
      } `}
    >
      {convertCase(label, CaseType.Title)}
    </Link>
  );
};

export default ChildLinkItem;
