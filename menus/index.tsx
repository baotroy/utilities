import { HiUser } from "react-icons/hi2";
import { MdAreaChart, MdCalendarMonth, MdOutlineDashboard, MdOutlineViewList, MdSettings } from "react-icons/md";
import { SiElement } from "react-icons/si";
interface childProps {
  label: string;
  href: string;
}
interface itemProps {
  label: string;
  href: string;
  icon?: any;
  slug: string;
  children?: childProps[];
}
interface menuProps {
  groupName: string;
  items: itemProps[];
}

const menus: menuProps[] = [
  {
    groupName: "MENU",
    items: [
      {
        label: "Dashboard",
        slug: "dashboard",
        href: "/",
        icon: MdOutlineDashboard,
        children: [
          {
            label: "eCommerce",
            href: "/",
          },
        ],
      },
      {
        label: "Calendar",
        slug: "calendar",
        href: "/calendar",
        icon: MdCalendarMonth,
      },
      {
        label: "Profile",
        slug  : "profile",
        href: "/profile",
        icon: HiUser,
      },
      {
        label: "Forms",
        slug: "forms",
        href: "#",
        icon: MdCalendarMonth,
        children: [
          {
            label: "Form Elements",
            href: "/forms/form-elements",
          },
          {
            label: "Form Layout",
            href: "/forms/form-layout",
          },
        ],
      },
      {
        label: "Tables",
        slug: "tables",
        href: "/tables",
        icon: MdOutlineViewList,
      },
      {
        label: "Settings",
        slug: "settings",
        href: "/settings",
        icon: MdSettings,
      },
    ],
  },
  {
    groupName: "OTHERS",
    items: [
      {
        label: "Chart",
        slug: "chart",
        href: "/chart",
        icon: MdAreaChart,
      },
      {
        label: "UI Elements",
        slug: "ui-elements",
        href: "#",
        icon: SiElement,
        children: [
          {
            label: "Alerts",
            href: "/ui/alerts",
          },
          {
            label: "Buttons",
            href: "/ui/buttons",
          },
        ]
      },
    ]
  }
];
export default menus;
