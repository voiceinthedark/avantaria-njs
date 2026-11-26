"use client";

import { useActionState, useState } from "react";
import { CreateCategoryAction } from "../actions";
import { FormMessage } from "../../_components/form-message";
import { inputClass, secondaryButtonClass } from "../../_components/form-styles";
import { Field } from "../../_components/field";

export default function CreateCategoryForm() {
  const [state, action, pending] = useActionState(CreateCategoryAction, undefined);

  const [values, setValues] = useState({
    name: "",
    slug: "",
  });

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form action={action} className="space-y-4">
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
