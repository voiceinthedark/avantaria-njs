"use client";

import { useActionState } from "react";
import { DeleteCategoryAction } from "./actions";
import { FormMessage } from "../_components/form-message";
import { deleteButtonClass } from "../_components/form-styles";

type DeleteCategoryFormProps = {
  categoryId: string;
  categoryName: string;
};

/**
 * Deletes the category. On success the action redirects to the list. If the
 * category has products, it is not deleted and the action returns a message
 * explaining that, which is shown here.
 * */
export default function DeleteCategoryForm({ categoryId, categoryName }: DeleteCategoryFormProps) {
  const [state, action, pending] = useActionState(DeleteCategoryAction, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${categoryName}"? Its products are not deleted, but they will no longer be categorized.`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="id" value={categoryId} />

      <button type="submit" disabled={pending} className={`${deleteButtonClass} w-full`}>
        {pending ? "Deleting…" : "Delete category"}
      </button>

      <FormMessage state={state} />
    </form>
  );
}
