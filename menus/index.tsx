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
  // slug: string;
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
        // slug: "/",
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
        // slug: "convert-case",
        href: "/string/convert-case",
        icon: null,
      },
      // {
      //   label: "Convert Units",
      //   // slug: "convert-units",
      //   href: "/string/convert-units",
      //   icon: null,
      // },
    ],
  },
  {
    groupName: "NUMBER",
    items: [
      // {
      //   label: "Big Number Calculator",
      //   // slug: "big-number-calculator",
      //   href: "/number/convert-case",
      //   icon: null,
      // },
      {
        label: "Ethereum Unit Converter",
        // slug: "ethereum-convert-units",
        href: "/number/ethereum-unit-converter",
        icon: null,
      },
    ],
  },
  {
    groupName: "DATE",
    items: [
      {
        label: "Epoch Converter",
        // slug: "epoch-converter",
        href: "/date/epoch-converter",
        icon: null,
      },
      // {
      //   label: "Date Difference",
      //   // slug: "date-difference",
      //   href: "/date/date-difference",
      //   icon: null,
      // },
    ],
  },
  {
    groupName: "DEV",
    items: [
      {
        label: "JSON Prettier",
        // slug: "convert-case",
        href: "/dev/json-prettier",
        icon: null,
      },
    ],
  },
  {
    groupName: "FILE",
    items: [
      {
        label: "File To Base64",
        // slug: "image-to-base64",
        href: "/file/file-to-base64",
        icon: null,
      },
    ],
  },
  {
    groupName: "IMAGE",
    items: [
      // {
      //   label: "Image Compressor",
      //   // slug: "image-compressor",
      //   href: "/image/image-compressor",
      //   icon: null,
      // },
      {
        label: "Image Resize",
        // slug: "image-resize",
        href: "/image/image-resize",
        icon: null,
      },
    ],
  },
];
export default menus;

// color picker
