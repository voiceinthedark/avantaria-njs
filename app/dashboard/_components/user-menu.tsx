import { requireStaffUser } from "@/lib/auth/dal";
import { logoutAction } from "../actions";

/** Reads the session, so render it inside <Suspense>. */
export async function UserMenu() {
  const user = await requireStaffUser();

  return (
    <div className="space-y-2 text-sm">
      <div>
        <p className="font-medium">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-foreground/60">{user.role}</p>
      </div>
      <form action={logoutAction}>
        <button type="submit" className="text-foreground/70 underline hover:text-foreground">
          Sign out
        </button>
      </form>
    </div>
  );
}
