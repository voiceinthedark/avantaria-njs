import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { AddressService } from "@/lib/services/address.service";
import {
  getAddressByIdSchema,
  updateAddressSchema,
} from "@/lib/validators/address.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Owner: single address. */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  const { userId } = await requireUser();
  const { id } = getAddressByIdSchema.parse(await params);
  return Response.json(await AddressService.getAddressById(id, userId));
});

/** Owner: update an address. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  const { userId } = await requireUser();
  const { id } = getAddressByIdSchema.parse(await params);
  const data = updateAddressSchema.parse(await req.json());
  return Response.json(await AddressService.updateAddress(id, userId, data));
});

/** Owner: delete an address not used by any order. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const { userId } = await requireUser();
  const { id } = getAddressByIdSchema.parse(await params);
  await AddressService.deleteAddress(id, userId);
  return new Response(null, { status: 204 });
});
