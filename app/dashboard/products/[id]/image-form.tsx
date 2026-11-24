"use client";

import { useActionState } from "react";
import { addImagesAction } from "./actions";
import { Field } from "../../_components/field";
import { FormMessage } from "../../_components/form-message";
import { buttonClass, inputClass } from "../../_components/form-styles";

/**
 * Uploads images and attaches them to the product in one step.
 * The file input is uncontrolled: React clears it after the action finishes.
 */
export default function ImageForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(addImagesAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />

      <Field
        label="Images"
        htmlFor="product-images"
        hint="Up to 5 images at once, 5 MB each. JPEG, PNG, WebP or AVIF."
      >
        <input
          id="product-images"
          name="images"
          type="file"
          multiple
          required
          accept="image/jpeg,image/png,image/webp,image/avif"
          className={inputClass}
        />
      </Field>

      <FormMessage state={state} />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Uploading…" : "Upload images"}
      </button>
    </form>
  );
}
