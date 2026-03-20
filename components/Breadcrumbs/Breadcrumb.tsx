import Link from "next/link";
import convertCase, { CaseType } from "@/app/string/utils";
import { usePathname } from "next/navigation";
import { menuItems } from "@/common/menu";
import { useMemo } from "react";

interface BreadcrumbProps {
  pageName?: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  const pathname = usePathname();

  const { pageTitle, pName, isBeta } = useMemo(() => {
    const pathElements = pathname.split("/");
    const menu = menuItems.find((m) => m.href === pathname);
    const name = pageName || pathElements[pathElements.length - 1].split("-").join(" ");
    const title = menu?.breadcrumbUseLabel ? menu.label : name;
    return {
      pageTitle: title,
      pName: name,
      isBeta: menu?.beta || false,
    };
  }, [pathname, pageName]);
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <h2 className="text-2xl sm:text-3xl font-semibold text-graydark dark:text-bodydark2">
        {convertCase(pageTitle, CaseType.Title)}{isBeta && <i> (beta)</i>}
      </h2>

      <nav className="hidden sm:block">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium" href="/">
              Home {pathname !== "/" ? "/" : ""}
            </Link>
          </li>
          <li className="font-medium">
            {convertCase(pName, CaseType.Title)}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
