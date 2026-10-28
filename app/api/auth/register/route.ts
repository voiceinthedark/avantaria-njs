import { handleRoute } from "@/lib/errors";
import { createSession } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { registerSchema } from "@/lib/validators/auth.schema";

export const POST = handleRoute(async (req) => {
  const data = registerSchema.parse(await req.json());
  const user = await AuthService.register(data);
  await createSession({ userId: user.id, role: user.role });
  return Response.json({ user }, { status: 201 });
});
