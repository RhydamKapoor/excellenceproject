import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma = new PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            firstName: "Super",
            lastName: "Admin",
            email: "admin@example.com",
            password: hashedPassword,
            role: "ADMIN",
        },
    });
    console.log("Admin user created!");
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());