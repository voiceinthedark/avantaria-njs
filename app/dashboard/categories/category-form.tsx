// category-form.tsx
"use client";

import { useActionState, useState } from "react";
import { CreateCategoryAction, UpdateCategoryAction } from "./actions";
import { FormMessage } from "../_components/form-message";
import { inputClass, secondaryButtonClass } from "../_components/form-styles";
import { Field } from "../_components/field";

type CategoryFormProps = {
  category?: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function CategoryForm({ category }: CategoryFormProps) {
  const [state, action, pending] = useActionState(
    category ? UpdateCategoryAction : CreateCategoryAction,
    undefined,
  );

  const [values, setValues] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
  });

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form action={action} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      <Field label="Name" htmlFor="category-name">
        <input
          id="category-name"
          name="name"
          type="text"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Slug" htmlFor="category-slug">
        <input
          id="category-slug"
          name="slug"
          type="text"
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending} className={`${secondaryButtonClass} w-full`}>
        {pending ? "Saving…" : "Save category"}
      </button>

      <FormMessage state={state} />
    </form>
  );
}
