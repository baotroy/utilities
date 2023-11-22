import Link from "next/link";
import convertCase, { CaseType } from "@/app/string/utils";
import { usePathname } from "next/navigation";
interface BreadcrumbProps {
  pageName?: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  const pathname = usePathname();
  const pathElements = pathname.split("/");
  if (!pageName) {
    pageName = pathElements[pathElements.length - 1].split("-").join(" ");
  }
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-graydark dark:text-bodydark2">
        {convertCase(pageName, CaseType.Title)}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium" href="/">
              Home /
            </Link>
          </li>
          <li className="font-medium text-bodydark2">
            {convertCase(pageName, CaseType.Title)}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
