import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  RegisterInput,
  LoginInput,
  BootstrapAdminInput,
} from "@/lib/validators/auth.schema";

const BCRYPT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
} as const;

// Compared against when the email is unknown so that response time
// doesn't reveal whether an account exists.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () =>
  (dummyHash ??= bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS));

export class AuthService {
  static async register(data: RegisterInput) {
    const { password, ...rest } = data;

    const existing = await prisma.user.findUnique({
      where: { email: rest.email },
    });
    if (existing) throw AppError.conflict("User already exists");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return prisma.user.create({
      data: { ...rest, passwordHash },
      select: publicUserSelect,
    });
  }

  static async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email } });

    const hash = user?.passwordHash ?? (await getDummyHash());
    const isValid = await bcrypt.compare(password, hash);

    if (!user || !isValid) {
      throw new AppError(401, "Invalid email or password");
    }

    const { passwordHash: _omit, ...publicUser } = user;
    return publicUser;
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
    if (!user) throw AppError.unauthorized();
    return user;
  }

  /**
   * Creates the very first ADMIN user. One-time bootstrap: refuses to
   * run if any ADMIN already exists.
   */
  static async bootstrapAdmin(data: BootstrapAdminInput) {
    const { password, ...rest } = data;

    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (existingAdmin) {
      throw AppError.conflict("An admin account already exists");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: rest.email },
    });
    if (existingUser) throw AppError.conflict("User already exists");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return prisma.user.create({
      data: { ...rest, passwordHash, role: "ADMIN" },
      select: publicUserSelect,
    });
  }
}
