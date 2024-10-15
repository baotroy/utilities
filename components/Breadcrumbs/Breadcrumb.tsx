import Link from "next/link";
import convertCase, { CaseType } from "@/app/string/utils";
import { usePathname } from "next/navigation";
import { menuItems } from "@/common/menu";
import { useEffect, useState } from "react";

interface BreadcrumbProps {
  pageName?: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  const pathname = usePathname();
  const pathElements = pathname.split("/");
  const [pageTitle, setPageTitle] = useState("");
  const [pName, setPName] = useState("");
  const [isBeta, setIsBeta] = useState(false);
  useEffect(() => {
    let pageTitle = "";
    if (!pageName) {
      const menu = menuItems.find((menu) => menu.href === pathname);
      pageName = pathElements[pathElements.length - 1].split("-").join(" ");
      pageTitle = pageName;
      if (menu?.breadcrumbUseLabel) {
        pageTitle = menu.label;
      }
      if (menu?.beta !== isBeta) {
        setIsBeta(menu?.beta || false);
      }
      setPageTitle(pageTitle);
      setPName(pageName);
    }
  }, [pathname]);
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-graydark dark:text-bodydark2">
        {convertCase(pageTitle, CaseType.Title)}{isBeta && <i> (beta)</i>}
      </h2>

      <nav>
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
