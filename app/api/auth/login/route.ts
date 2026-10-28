import { handleRoute } from "@/lib/errors";
import { createSession } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validators/auth.schema";

export const POST = handleRoute(async (req) => {
  const data = loginSchema.parse(await req.json());
  const user = await AuthService.login(data);
  await createSession({ userId: user.id, role: user.role });
  return Response.json({ user });
});
