"use client";

import { useActionState } from "react";
import { deleteCategoryAction } from "../actions";
import { FormMessage } from "../../_components/form-message";
import { deleteButtonClass } from "../../_components/form-styles";

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
  const [state, action, pending] = useActionState(deleteCategoryAction, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${categoryName}"? This cannot be undone. If the category has products, it will not be deleted.`,
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
