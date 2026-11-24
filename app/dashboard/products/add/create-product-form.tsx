"use client";

import { useActionState, useState } from "react";
import { createProductAction } from "../actions";
import { Field } from "../../_components/field";
import { FormMessage } from "../../_components/form-message";
import { buttonClass, inputClass } from "../../_components/form-styles";

type CreateProductFormProps = {
  categories: { id: string; name: string }[];
};

/**
 * Creates a product together with its first variant (a product must always
 * have one). On success the action redirects to the edit page, where more
 * variants and images can be added.
 */
export default function CreateProductForm({ categories }: CreateProductFormProps) {
  const [state, action, pending] = useActionState(createProductAction, undefined);

  // Controlled, so a failed save doesn't wipe what the admin typed.
  const [values, setValues] = useState({
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    categoryId: categories[0]?.id ?? "",
    isFeatured: false,
    sku: "",
    size: "",
    color: "",
    stockQty: "",
    priceDelta: "",
  });

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form action={action} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-medium">Product</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="product-name">
            <input
              id="product-name"
              name="name"
              type="text"
              required
              minLength={2}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="product-slug"
            hint="Lower-case and hyphenated. It becomes the product's public URL."
          >
            <input
              id="product-slug"
              name="slug"
              type="text"
              required
              minLength={2}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="product-description" hint="At least 10 characters.">
          <textarea
            id="product-description"
            name="description"
            required
            minLength={10}
            rows={5}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Base price"
            htmlFor="product-base-price"
            hint="Variants can add or subtract from this."
          >
            <input
              id="product-base-price"
              name="basePrice"
              type="number"
              inputMode="decimal"
              required
              min="0.01"
              step="0.01"
              value={values.basePrice}
              onChange={(e) => set("basePrice", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Category" htmlFor="product-category">
            <select
              id="product-category"
              name="categoryId"
              required
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured
        </label>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-medium">First variant</h2>
          <p className="text-sm text-foreground/60">
            Every product needs at least one. You can add more after creating it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" htmlFor="variant-sku">
            <input
              id="variant-sku"
              name="sku"
              type="text"
              required
              minLength={3}
              value={values.sku}
              onChange={(e) => set("sku", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Stock quantity" htmlFor="variant-stockQty">
            <input
              id="variant-stockQty"
              name="stockQty"
              type="number"
              required
              min={0}
              step={1}
              value={values.stockQty}
              onChange={(e) => set("stockQty", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Size" htmlFor="variant-size">
            <input
              id="variant-size"
              name="size"
              type="text"
              required
              value={values.size}
              onChange={(e) => set("size", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Color" htmlFor="variant-color">
            <input
              id="variant-color"
              name="color"
              type="text"
              required
              value={values.color}
              onChange={(e) => set("color", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Price delta" htmlFor="variant-priceDelta" hint="Optional. Defaults to 0.">
            <input
              id="variant-priceDelta"
              name="priceDelta"
              type="number"
              inputMode="decimal"
              step={0.01}
              value={values.priceDelta}
              onChange={(e) => set("priceDelta", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <FormMessage state={state} />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Creating…" : "Create product"}
      </button>
    </form>
  );
}
