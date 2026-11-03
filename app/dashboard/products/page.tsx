import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffUser } from "@/lib/auth/dal";
import { formatCurrency } from "@/lib/format";
import { CategoryService } from "@/lib/services/category.service";
import { ProductService } from "@/lib/services/product.service";
import { listProductsQuerySchema } from "@/lib/validators/product.schema";
import { buttonClass, inputClass, secondaryButtonClass } from "../_components/form-styles";
import { Pagination } from "../_components/pagination";
import { StatusBadge } from "../_components/status-badge";

const BASE_PATH = "/dashboard/products";

type SearchParams = Record<string, string | string[] | undefined>;

/** First value of each param, with empty values (blank form fields) dropped. */
function cleanParams(searchParams: SearchParams) {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) clean[key] = first;
  }
  return clean;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireStaffUser();

  const params = cleanParams(await searchParams);
  const parsed = listProductsQuerySchema.safeParse(params);
  // Bad filters (e.g. hand-edited URLs) fall back to the defaults.
  const query = parsed.success ? parsed.data : listProductsQuerySchema.parse({});

  const [result, categories] = await Promise.all([
    ProductService.getProducts(query, { includeInactive: true }),
    CategoryService.getAllCategories(),
  ]);

  // A stale link to a page that no longer exists: jump to the last one.
  if (result.totalPages > 0 && query.page > result.totalPages) {
    const last = new URLSearchParams(params);
    last.set("page", String(result.totalPages));
    redirect(`${BASE_PATH}?${last.toString()}`);
  }

  const hasFilters = Object.keys(params).some((key) => key !== "page" && key !== "limit");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Products</h1>

      {!parsed.success && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
          Some filters were invalid and have been ignored.
        </p>
      )}

      {/* Plain GET form: filters live in the URL, so they're shareable and need no JS. */}
      <form method="get" action={BASE_PATH} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search by name"
          aria-label="Search"
          className={inputClass}
        />
        <select
          name="category"
          defaultValue={params.category ?? ""}
          aria-label="Category"
          className={inputClass}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="active"
          defaultValue={params.active ?? ""}
          aria-label="Status"
          className={inputClass}
        >
          <option value="">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>

        <div className="flex gap-2">
          <button type="submit" className={buttonClass}>
            Apply filters
          </button>
          {hasFilters && (
            <Link href={BASE_PATH} className={secondaryButtonClass}>
              Reset
            </Link>
          )}
        </div>
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 p-6 text-center text-sm text-foreground/60">
          {hasFilters ? "No products match these filters." : "No products yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs text-foreground/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Base price</th>
                <th className="px-4 py-3 text-right font-medium">Variants</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {result.items.map((product) => {
                const stock = product.variants.reduce((sum, v) => sum + v.stockQty, 0);
                const image = product.images[0];

                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {image ? (
                          // Admin thumbnail: product images can come from any host, so plain <img>.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.url}
                            alt={image.altText ?? ""}
                            loading="lazy"
                            className="size-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded-md bg-foreground/10" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-xs text-foreground/60">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.category.name}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatCurrency(product.basePrice)}
                    </td>
                    <td className="px-4 py-3 text-right">{product.variants.length}</td>
                    <td
                      className={`px-4 py-3 text-right ${
                        stock === 0 ? "font-medium text-red-600 dark:text-red-400" : ""
                      }`}
                    >
                      {stock}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge value={product.isActive ? "ACTIVE" : "INACTIVE"} />
                        {product.isFeatured && <StatusBadge value="FEATURED" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath={BASE_PATH}
        params={params}
        page={result.page}
        limit={result.limit}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
