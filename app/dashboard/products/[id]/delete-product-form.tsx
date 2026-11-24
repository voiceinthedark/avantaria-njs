"use client";

import { useActionState } from "react";
import { deleteProductAction } from "./actions";
import { FormMessage } from "../../_components/form-message";
import { secondaryButtonClass } from "../../_components/form-styles";

type DeleteProductFormProps = {
  productId: string;
  productName: string;
};

/**
 * Deletes the product. On success the action redirects to the list. If the
 * product appears in orders it is only deactivated, and the action returns a
 * message explaining that, which is shown here.
 */
export default function DeleteProductForm({ productId, productName }: DeleteProductFormProps) {
  const [state, action, pending] = useActionState(deleteProductAction, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${productName}"? Its variants and images are removed too. ` +
            "Products that appear in orders are deactivated instead.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="id" value={productId} />

      <button
        type="submit"
        disabled={pending}
        className={`${secondaryButtonClass} border-red-600/40 text-red-600 dark:text-red-400`}
      >
        {pending ? "Deleting…" : "Delete product"}
      </button>

      <FormMessage state={state} />
    </form>
  );
}
