import Link from "next/link";

type Props = {
  basePath: string;
  /** Current filters. `page` is ignored and rebuilt for each link. */
  params: Record<string, string>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

const itemClass = "min-w-9 rounded-md border px-3 py-1.5 text-center text-sm";

/** Server-rendered pagination. Works without client JS; links keep filters. */
export function Pagination({ basePath, params, page, limit, total, totalPages }: Props) {
  if (total === 0) return null;

  const hrefFor = (target: number) => {
    const query = new URLSearchParams(params);
    query.delete("page");
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
      <p className="text-foreground/60">
        Showing {from}–{to} of {total}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              className={`${itemClass} border-foreground/20 hover:bg-foreground/5`}
            >
              Previous
            </Link>
          ) : (
            <span className={`${itemClass} border-transparent text-foreground/30`}>Previous</span>
          )}

          {pageWindow(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-foreground/50">
                …
              </span>
            ) : p === page ? (
              <span
                key={p}
                aria-current="page"
                className={`${itemClass} border-foreground bg-foreground font-medium text-background`}
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={hrefFor(p)}
                className={`${itemClass} border-foreground/20 hover:bg-foreground/5`}
              >
                {p}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1)}
              className={`${itemClass} border-foreground/20 hover:bg-foreground/5`}
            >
              Next
            </Link>
          ) : (
            <span className={`${itemClass} border-transparent text-foreground/30`}>Next</span>
          )}
        </nav>
      )}
    </div>
  );
}
