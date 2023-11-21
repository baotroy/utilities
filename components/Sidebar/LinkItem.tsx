import Link from "next/link";
import React, { useState } from "react";
import { IconType } from "react-icons";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import clsx from "clsx";

interface LinkItemProps {
  label: string;
  slug?: string;
  isFocus?: boolean;
  href: string;
  isParent?: boolean;
  isOpen?: boolean;
  icon: IconType;
  handleClick?: (e: any) => void;
}

const LinkItem: React.FC<LinkItemProps> = ({ label, slug, isFocus, href, isParent, isOpen, icon: Icon, handleClick }) => {
  // const [isOpen, setIsOpen] = useState(open || false)

  // function handleClick() {
  //     setIsOpen(!isOpen)
  // }
  return (
    <li>
      <Link
        href={href}
        //   className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4`}
        className={clsx(
          `group relative flex items-center gap-2.5 rounded-sm py-1 px-4 font-medium text-graydark duration-300 ease-in-out hover:text-bodydark2 dark:hover:bg-meta-4`,
          isFocus && "bg-graydark dark:bg-meta-4"
        )}
        onClick={handleClick}
      >
        <Icon size={20} />
        {label}
        {isParent && (isOpen ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />)}
      </Link>
    </li>
  );
};

export default LinkItem;
