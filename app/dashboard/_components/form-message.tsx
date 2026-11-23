export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string }
  | undefined;

/** Shows the outcome of a Server Action under a form. */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;

  if (!state.ok) {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {state.error}
      </p>
    );
  }
  return state.message ? (
    <p role="status" className="text-sm text-green-700 dark:text-green-400">
      {state.message}
    </p>
  ) : null;
}
