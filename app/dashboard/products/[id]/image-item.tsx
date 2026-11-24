"use client";

import { useActionState } from "react";
import { removeImageAction } from "./actions";
import { FormMessage } from "../../_components/form-message";
import { secondaryButtonClass } from "../../_components/form-styles";

type ImageItemProps = {
  image: { id: string; url: string; altText: string | null };
  productId: string;
};

/** One image with a remove button. */
export default function ImageItem({ image, productId }: ImageItemProps) {
  const [state, action, pending] = useActionState(removeImageAction, undefined);

  return (
    <li className="space-y-2 rounded-xl border border-foreground/10 p-2">
      {/* Admin preview: images come from Supabase storage, so a plain <img> is fine. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.altText ?? ""}
        loading="lazy"
        className="aspect-square w-full rounded-md object-cover"
      />

      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm("Remove this image?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageId" value={image.id} />
        <button type="submit" disabled={pending} className={`${secondaryButtonClass} w-full`}>
          {pending ? "Removing…" : "Remove"}
        </button>
      </form>

      <FormMessage state={state} />
    </li>
  );
}
