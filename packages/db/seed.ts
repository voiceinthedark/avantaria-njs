// filepath: packages/db/seed.ts

import "dotenv/config";
import { prisma } from "@store/db/index";
import bcrypt from "bcryptjs";

async function main() {
  const password = process.env.ADMIN_PASSWORD || "avantariaadmin";
  const email = process.env.ADMIN_EMAIL || "admin@avantaria.com";
  // hash password for the admin user
  const hashedPassword = await bcrypt.hash(password, 12);

  // 1. Check if the global admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seeding.");
    return;
  }

  // 2. Seed database with global admin user
  await prisma.user.create({
    data: {
      email: email,
      firstName: "Avantaria",
      lastName: "Admin",
      passwordHash: hashedPassword, // Replace with a real hashed password
      role: "ADMIN",
    },
  });

  console.log("Created global admin user with email:", email);
  console.log("Admin password:", password);
  console.log(
    "Please change the password after first login for security reasons.",
  );
}

console.log("Connecting to database: ", process.env.DATABASE_URL);

main()
  .then(async () => {
    console.log("Seeding completed successfully.");
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
