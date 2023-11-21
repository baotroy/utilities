import Link from 'next/link';
import React from 'react';
import { IconType } from 'react-icons';
import ChildLinkItem, {ChildLinkItemProps} from './ChildLinkItem'

export interface ChildrenLinkItemsProps {
    items?: ChildLinkItemProps[],
    currentPathname: string,
    isOpen?: boolean
}

const ChildrenLinkItems: React.FC<ChildrenLinkItemsProps> = ({
    items,
    currentPathname,
    isOpen,
}) => {
  
    return (
        <div
        className={`translate transform overflow-hidden ${
          !isOpen && "hidden"
        }`}
      >
        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
          {
            items?.map((child, index) => (
                <ChildLinkItem key={index} label={child.label} icon={child.icon} href={child.href} currentPathname={currentPathname} />
            ))
          }
        </ul>
      </div>
    );
};

export default ChildrenLinkItems;
