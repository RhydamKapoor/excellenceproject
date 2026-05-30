import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedConfig } from "../src/lib/serverConfig.js";

const prisma = new PrismaClient();

async function main() {
  if (!seedConfig.adminPassword) {
    console.warn(
      "SEED_ADMIN_PASSWORD is not set — skipping admin user seed. Set it in .env to create a seed admin."
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(seedConfig.adminPassword, 10);
  await prisma.user.upsert({
    where: { email: seedConfig.adminEmail },
    update: {},
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: seedConfig.adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      provider: "credentials",
    },
  });
  console.log(`Admin user seeded: ${seedConfig.adminEmail}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
