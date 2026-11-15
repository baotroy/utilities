import { IconType } from "react-icons";
import {
  MdOutlineDashboard,
  MdTextFields,
  MdNumbers,
  MdCalendarToday,
  MdCode,
  MdInsertDriveFile,
  MdImage,
  MdApps,
  MdCloudQueue,
} from "react-icons/md";
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
  groupIcon?: IconType | null;
  items: itemProps[];
}

const menus: menuProps[] = [
  {
    groupName: "",
    groupIcon: null,
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
    groupIcon: MdTextFields,
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
      {
        label: "String Escape / Unescape",
        href: "/string/string-escape",
        icon: null,
        breadcrumbUseLabel: true,
      },
    ],
  },
  {
    groupName: "NUMBER",
    groupIcon: MdNumbers,
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
      {
        label: "Byte Size Converter",
        href: "/number/byte-converter",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Bitwise Calculator",
        href: "/number/bitwise-calculator",
        icon: null,
      },
    ],
  },
  {
    groupName: "DATE",
    groupIcon: MdCalendarToday,
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
    groupIcon: MdCode,
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
        label: "Universal Calldata Decoder",
        href: "/dev/universal-calldata-decoder",
        icon: null,
        breadcrumbUseLabel: true,
        beta: true,
      },
      {
        label: "ABI Selectors",
        // slug: "convert-case",
        href: "/dev/abi-selectors",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Signature to Selector",
        href: "/dev/signature-to-selector",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Array Sorter",
        href: "/dev/array-sorter",
        icon: null,
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
        label: "AES Encrypt/Decrypt",
        href: "/dev/aes-encrypt-decrypt",
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
      {
        label: "CSP Header Generator",
        href: "/dev/csp-header-generator",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Regex Builder",
        href: "/dev/regex-builder",
        icon: null,
      },
      {
        label: "Block ↔ Timestamp",
        href: "/dev/block-timestamp",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "EVM Transaction Simulator",
        href: "/dev/evm-transaction-simulator",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Transaction Decoder",
        href: "/dev/transaction-decoder",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "ABI Encoder",
        href: "/dev/abi-encoder",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Event Log Decoder",
        href: "/dev/event-log-decoder",
        icon: null,
      },
      {
        label: "Revert Reason Decoder",
        href: "/dev/revert-decoder",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Ethereum Signature Verifier",
        href: "/dev/signature-verifier",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Ethereum Address Tools",
        href: "/dev/address-tools",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "Storage Slot Reader",
        href: "/dev/storage-slot-reader",
        icon: null,
      },
      {
        label: "YAML / TOML / JSON Converter",
        href: "/dev/yaml-json-converter",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "URL Encoder & Parser",
        href: "/dev/url-encoder",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "JSONPath Tester",
        href: "/dev/json-path",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: "JSON Diff",
        href: "/dev/json-diff",
        icon: null,
        breadcrumbUseLabel: true,
      },
    ],
  },
  {
    groupName: "DEVOPS",
    groupIcon: MdCloudQueue,
    items: [
      {
        label: "docker run ↔ docker-compose",
        href: "/devops/docker-compose-converter",
        icon: null,
        breadcrumbUseLabel: true,
      },
      {
        label: ".env ↔ JSON/YAML",
        href: "/devops/env-converter",
        icon: null,
      },
      {
        label: "Nginx Config Generator",
        href: "/devops/nginx-config-generator",
        icon: null,
      },
      {
        label: "robots.txt Generator",
        href: "/devops/robots-txt-generator",
        icon: null,
        breadcrumbUseLabel: true,
      },
    ],
  },
  {
    groupName: "FILE",
    groupIcon: MdInsertDriveFile,
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
      {
        label: "Base64 to File",
        href: "/file/base64-to-file",
        icon: null,
        breadcrumbUseLabel: true,
      },
    ],
  },
  {
    groupName: "IMAGE",
    groupIcon: MdImage,
    items: [
      {
        label: "Image Resize",
        // slug: "image-resize",
        href: "/image/image-resize",
        icon: null,
      },
      {
        label: "Favicon Generator",
        href: "/image/favicon-generator",
        icon: null,
      },
      {
        label: "Image Compressor & Converter",
        href: "/image/image-compressor",
        icon: null,
        breadcrumbUseLabel: true,
      },
    ],
  },
  {
    groupName: "MISC",
    groupIcon: MdApps,
    items: [
      {
        label: "Random Password Generator",
        // slug: "image-resize",
        href: "/misc/random-password-generator",
        icon: null,
      },
      {
        label: "Password Strength Analyzer",
        href: "/misc/password-strength-analyzer",
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
      {
        label: "DNS Lookup",
        href: "/misc/dns-lookup",
        icon: null,
      },
      {
        label: "CIDR / Subnet Calculator",
        href: "/misc/cidr-calculator",
        icon: null,
        breadcrumbUseLabel: true,
      },
    ],
  },
];

// Sort items within each group alphabetically (except Home group)
const sortedMenus: menuProps[] = menus.map((group) => ({
  ...group,
  items: group.groupName
    ? [...group.items].sort((a, b) => a.label.localeCompare(b.label))
    : group.items,
}));

export const menuItems: itemProps[] = sortedMenus.flatMap((group) => group.items);

export default sortedMenus;

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
