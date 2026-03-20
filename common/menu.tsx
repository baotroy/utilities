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
  breadcrumbUseLabel?: boolean;
  // slug: string;
  children?: childProps[];
  beta?: boolean;
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
      {
        label: "Text Compare",
        href: "/string/text-compare",
        icon: null,
      },
      {
        label: "Regex Tester",
        href: "/string/regex-tester",
        icon: null,
      },
    ],
  },
  {
    groupName: "NUMBER",
    items: [
      {
        label: "Big Number Calculator",
        href: "/number/big-number-calculator",
        icon: null,
      },
      {
        label: "Number Conversion",
        // slug: "ethereum-convert-units",
        href: "/number/number-conversion",
        icon: null,
      },
      {
        label: "Decimal to Fraction",
        // slug: "ethereum-convert-units",
        href: "/number/decimal-to-fraction",
        icon: null,
      },
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
      {
        label: "Date Difference",
        href: "/date/date-difference",
        icon: null,
      },
      {
        label: "Timezone Converter",
        href: "/date/timezone-converter",
        icon: null,
      },
    ],
  },
  {
    groupName: "DEV",
    items: [
      {
        label: "UUID Generator",
        href: "/dev/uuid-generator",
        icon: null,
      },
      {
        label: "JSON Prettier",
        // slug: "convert-case",
        href: "/dev/json-prettier",
        icon: null,
      },
      {
        label: "JWT Decoder",
        // slug: "convert-case",
        href: "/dev/jwt-decoder",
        icon: null,
      },
      {
        label: "MongoDB ObjectId to Timestamp",
        // slug: "convert-case",
        href: "/dev/mongodb-objectid-time",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Basic Authentication Header Generator",
        // slug: "convert-case",
        href: "/dev/basic-authentication-header",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "NGINX Htpasswd Generator",
        href: "/dev/htpasswd-generator",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Calldata Decoder",
        href: "/dev/ethereum-input-data-decoder",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Universal Calldata Decoder",
        href: "/dev/universal-calldata-decoder",
        icon: null,
        breadcrumbUseLabel: true,
        beta: true,
      },
      {
        label: "Encode Function",
        // slug: "convert-case",
        href: "/dev/encode-function",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Cron Expression Editor",
        href: "/dev/cron-editor",
        icon: null,
      },
      {
        label: "Object Serializer",
        href: "/dev/object-serializer",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Hash Generator",
        href: "/dev/hash-generator",
        icon: null,
      },
      {
        label: "Keccak-256 Hash",
        href: "/dev/keccak256",
        icon: null,
      },
      {
        label: "HTTP Status Codes",
        href: "/dev/http-status-codes",
        icon: null,
      },
      {
        label: "Diff Viewer",
        href: "/dev/diff-viewer",
        icon: null,
      },
      {
        label: "Base64 Encode/Decode",
        href: "/dev/base64-encoder",
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
      {
        label: "Chmod Calculator",
        href: "/file/chmod-calculator",
        icon: null,
      },
      {
        label: "CSV to JSON",
        href: "/file/csv-to-json",
        icon: null,
      },
      {
        label: "JSON to CSV",
        href: "/file/json-to-csv",
        icon: null,
      },
    ],
  },
  {
    groupName: "IMAGE",
    items: [
      {
        label: "Image Resize",
        // slug: "image-resize",
        href: "/image/image-resize",
        icon: null,
      },
    ],
  },
  {
    groupName: "MISC",
    items: [
      {
        label: "Random Password Generator",
        // slug: "image-resize",
        href: "/misc/random-password-generator",
        icon: null,
      },
      {
        label: "RGB to Hex",
        // slug: "image-resize",
        href: "/misc/rgb-to-hex",
        icon: null,
      },
      {
        label: "QR Code Reader & Generator",
        href: "/misc/qr-code-reader",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Ethereum Private Key Address Database",
        href: "/misc/ethereum-private-key-address-database",
        icon: null,
      },
      {
        label: "Color Picker",
        href: "/misc/color-picker",
        icon: null,
      },
      {
        label: "IP Address Lookup",
        href: "/misc/ip-address-lookup",
        icon: null,
      },
    ],
  },
];

export const menuItems = menus.reduce(
  (acc: itemProps[], curr: menuProps): itemProps[] => {
    return [...acc, ...curr.items];
  },
  []
);

export default menus;

// color picker
// MongoDB ObjectId ↔ Timestamp Converter
// UUID Generator
// passwordsgenerator *
// number conversation (hex, binary, decimal, octal) *
// Decimal to Fraction Converter
// rgb to hex
// cron guru
// string to slug
// string to kebab-case
// string to snake_case
// string to camelCase
// string to PascalCase
