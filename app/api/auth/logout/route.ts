import { handleRoute } from "@/lib/errors";
import { destroySession } from "@/lib/auth/session";

export const POST = handleRoute(async () => {
  await destroySession();
  return new Response(null, { status: 204 });
});
