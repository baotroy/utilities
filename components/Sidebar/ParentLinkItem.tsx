import Link from 'next/link';
import React from 'react';
import { IconType } from 'react-icons';
import clsx from 'clsx';

interface ParentLinkItemProps {
    label: string
    slug?: string
    focus?: boolean
    href: string
    icon: IconType
    handleClick?: () => void
}

const ParentLinkItem: React.FC<ParentLinkItemProps> = ({
    label,
    slug,
    focus,
    href,
    icon: Icon,
    handleClick
}) => {
    return (
                <Link
                  href={href}
                //   className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4`}
                className={clsx(
                    `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4`,
                    focus && "bg-graydark dark:bg-meta-4"
                    )}
                    onClick={handleClick}
                >
                  <Icon size={20}/>
                  {label}
                </Link>
    );
};

export default LinkItem;
