import { IconType } from "react-icons";
import { MdOutlineDashboard } from "react-icons/md";
interface childProps {
  label: string;
  href: string;
}
interface itemProps {
  label: string;
  href: string;
  icon?: IconType | null;
  slug: string;
  children?: childProps[];
}
interface menuProps {
  groupName: string | null;
  items: itemProps[];
}

const menus: menuProps[] = [
  {
    groupName: "",
    items: [
      {
        label: "Home",
        slug: "home",
        href: "/",
        icon: MdOutlineDashboard,
      },

    ],
  },
  {
    groupName: "STRING",
    items: [
      {
        label: "Convert Case",
        slug: "convert-case",
        href: "/convert-case",
        icon: null,
      },

    ],
  },
];
export default menus;
