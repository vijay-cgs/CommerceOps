/* eslint-disable no-console */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const STAFF_ACCOUNTS = [
  { email: "admin@commerceops.local", name: "Store Admin", role: "admin" },
  { email: "inventory@commerceops.local", name: "Inventory Manager", role: "inventory_manager" },
  { email: "readonly@commerceops.local", name: "Read-only Ops", role: "read_only" },
];

async function seedStaffAccounts() {
  const password = process.env.SEED_STAFF_PASSWORD;

  if (!password) {
    console.log("- Skipped staff accounts (set SEED_STAFF_PASSWORD to seed them)");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  for (const account of STAFF_ACCOUNTS) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, passwordHash, isActive: true },
      create: { ...account, passwordHash },
    });
  }

  console.log(`\u2713 Seeded ${STAFF_ACCOUNTS.length} staff accounts`);
}

const CATALOG = [
  {
    slug: "aerolite-backpack",
    sku: "BACKPACK-001",
    name: "AeroLite Backpack",
    priceCents: 12900,
    tag: "Best seller",
    category: "Travel",
    description:
      "A lightweight, weather-ready backpack built for city commutes and weekend escapes.",
    accent: "from-sky-500 to-cyan-500",
    features: ["Water resistant shell", "Laptop sleeve", "Hidden security pocket"],
  },
  {
    slug: "coredesk-lamp",
    sku: "LAMP-001",
    name: "CoreDesk Lamp",
    priceCents: 8900,
    tag: "New arrival",
    category: "Workspace",
    description:
      "An adjustable LED desk lamp that brings a warm, focused glow to every work session.",
    accent: "from-violet-500 to-fuchsia-500",
    features: ["Touch dimmer", "USB-C power", "Low-glare optics"],
  },
  {
    slug: "terra-bottle",
    sku: "BOTTLE-001",
    name: "Terra Bottle",
    priceCents: 3400,
    tag: "Daily essential",
    category: "Lifestyle",
    description: "A stainless steel insulated bottle that keeps drinks cold for up to 24 hours.",
    accent: "from-emerald-500 to-teal-500",
    features: ["Double wall insulated", "Leak-proof lid", "BPA free"],
  },
  {
    slug: "stride-running-shoes",
    sku: "SHOES-001",
    name: "Stride Runner",
    priceCents: 14900,
    tag: "Performance",
    category: "Fitness",
    description:
      "Responsive everyday running shoes designed for comfort, stability, and all-day motion.",
    accent: "from-amber-500 to-orange-500",
    features: ["Cushioned midsole", "Breathable mesh", "Grip-ready outsole"],
  },
];

async function seedCatalog() {
  for (const product of CATALOG) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log(`\u2713 Seeded ${CATALOG.length} products`);
}

async function seed() {
  try {
    await seedStaffAccounts();
    await seedCatalog();

    // Clear existing data
    await prisma.inventoryAdjustment.deleteMany({});
    await prisma.inventoryLevel.deleteMany({});

    // Create sample inventory levels
    const levels = await prisma.inventoryLevel.createMany({
      data: [
        {
          sku: "BACKPACK-001",
          locationId: "warehouse-main",
          availableQty: 45,
          reservedQty: 5,
          incomingQty: 10,
          expectedVersion: 1,
        },
        {
          sku: "LAMP-001",
          locationId: "warehouse-main",
          availableQty: 28,
          reservedQty: 2,
          incomingQty: 15,
          expectedVersion: 1,
        },
        {
          sku: "BOTTLE-001",
          locationId: "warehouse-main",
          availableQty: 120,
          reservedQty: 20,
          incomingQty: 50,
          expectedVersion: 1,
        },
        {
          sku: "SHOES-001",
          locationId: "warehouse-main",
          availableQty: 38,
          reservedQty: 8,
          incomingQty: 25,
          expectedVersion: 1,
        },
      ],
    });

    console.log(`✓ Seeded ${levels.count} inventory levels`);

    // Fetch the created levels to get their IDs
    const createdLevels = await prisma.inventoryLevel.findMany();

    // Create sample adjustment history
    if (createdLevels.length >= 3) {
      const adjustments = await prisma.inventoryAdjustment.createMany({
        data: [
          {
            inventoryLevelId: createdLevels[0].id,
            reasonCode: "stock_count_correction",
            deltaQty: 5,
            previousAvailable: 40,
            newAvailable: 45,
            idempotencyKey: "seed-001-" + Date.now(),
            correlationId: "seed-adjustment-001",
            actorUserId: "seed-admin-001",
          },
          {
            inventoryLevelId: createdLevels[1].id,
            reasonCode: "manual_restock",
            deltaQty: -2,
            previousAvailable: 30,
            newAvailable: 28,
            idempotencyKey: "seed-002-" + Date.now(),
            correlationId: "seed-adjustment-002",
            actorUserId: "seed-admin-001",
          },
          {
            inventoryLevelId: createdLevels[3].id,
            reasonCode: "operations_adjustment",
            deltaQty: 3,
            previousAvailable: 35,
            newAvailable: 38,
            idempotencyKey: "seed-003-" + Date.now(),
            correlationId: "seed-adjustment-003",
            actorUserId: "seed-admin-001",
          },
        ],
      });

      console.log(`✓ Seeded ${adjustments.count} adjustment events`);
    }

    console.log("✓ Database seed completed successfully");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
