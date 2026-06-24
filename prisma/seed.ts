import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminEmail = "admin@quizai.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash("Admin123!", 12);
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        subscriptionStatus: "PREMIUM",
      },
    });
    console.log("✅ Admin user created:", admin.email);
    console.log("   Password: Admin123!");
    console.log("   ⚠️  Change this password immediately after first login!");
  } else {
    console.log("ℹ️  Admin user already exists:", adminEmail);
  }

  // Create a sample regular user
  const sampleEmail = "demo@quizai.com";
  const existingSample = await prisma.user.findUnique({ where: { email: sampleEmail } });

  if (!existingSample) {
    const passwordHash = await bcrypt.hash("Demo123!", 12);
    await prisma.user.create({
      data: {
        name: "Demo User",
        email: sampleEmail,
        passwordHash,
        role: "USER",
        subscriptionStatus: "FREE",
      },
    });
    console.log("✅ Demo user created:", sampleEmail);
    console.log("   Password: Demo123!");
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
