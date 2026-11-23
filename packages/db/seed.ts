// filepath: packages/db/seed.ts

import "dotenv/config";
import { prisma } from "@store/db/index";
import bcrypt from "bcryptjs";

async function main() {
  const password = process.env.ADMIN_PASSWORD || "avantariaadmin";
  const email = process.env.ADMIN_EMAIL || "admin@avantaria.com";
  // hash password for the admin user
  const hashedPassword = await bcrypt.hash(password, 12);
  const phone = process.env.ADMIN_PHONE || "+1234567890";

  // STEP 0.1:
  // NOTE: adding a random customer
  const cPassword = "123456";
  const cEmail = "customer@avantaria.com";
  const cHashedPassword = await bcrypt.hash(cPassword, 12);
  const cPhone = "+1234567891";

  const existingCustomer = await prisma.user.findUnique({
    where: { email: cEmail },
  });

  if (!existingCustomer) {
    await prisma.user.create({
      data: {
        email: cEmail,
        firstName: "Avantaria",
        lastName: "Customer",
        passwordHash: cHashedPassword,
        phone: cPhone,
        role: "CUSTOMER",
      },
    });
    console.log("Created global customer user with email:", cEmail);
    console.log("Customer password:", cPassword);
  }

  // ── 0.2. Seed database with dummy products ────────────────────────────
  interface Category {
    id: string;
    name: string;
    slug: string;
  }

  // Create Categories first
  const categories = [
    { name: "Category 1", slug: "category-1" },
    { name: "Category 2", slug: "category-2" },
    { name: "Category 3", slug: "category-3" },
  ];

  for (const category of categories) {
    await prisma.category.create({
      data: category,
    });
  }

  const cat = (await prisma.category.findUnique({
    where: { slug: "category-1" },
  })) as Category; // Type assertion to ensure 'cat' is of type 'Category'

  console.log("Seeded database with dummy categories.");

  const products = [
    {
      name: "Product 1",
      slug: "product-1",
      basePrice: 10.0,
      description: "This is product 1",
      categoryId: cat.id, // Use the 'id' of the created category
    },
    {
      name: "Product 2",
      slug: "product-2",
      basePrice: 20.0,
      description: "This is product 2",
      categoryId: cat.id, // Use the 'id' of the created category
    },
    {
      name: "Product 3",
      slug: "product-3",
      basePrice: 30.0,
      description: "This is product 3",
      categoryId: cat.id,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log("Seeded database with dummy products.");

  // ── 1. Check if the global admin user already exists ────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seeding.");
    return;
  }

  // ── 2. Seed database with global admin user ─────────────────────────
  await prisma.user.create({
    data: {
      email: email,
      firstName: "Avantaria",
      lastName: "Admin",
      passwordHash: hashedPassword, // Replace with a real hashed password
      phone: phone,
      role: "ADMIN",
    },
  });

  console.log("Created global admin user with email:", email);
  console.log("Admin password:", password);
  console.log("Please change the password after first login for security reasons.");
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
