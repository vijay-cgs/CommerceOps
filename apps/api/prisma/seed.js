/* eslint-disable no-console */

async function seed() {
  console.log("BOOT-004 seed placeholder: implement PrismaClient inserts in BOOT-005.");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
