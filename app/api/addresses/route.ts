import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { AddressService } from "@/lib/services/address.service";
import { createAddressSchema } from "@/lib/validators/address.schema";

/** Signed-in user: list own addresses. */
export const GET = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await AddressService.getAddresses(userId));
});

/** Signed-in user: create an address. */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const data = createAddressSchema.parse(await req.json());
  return Response.json(await AddressService.createAddress(userId, data), {
    status: 201,
  });
});
