import prisma from "./src/config/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed RoleConfig
  const roleConfigs = [
    { role: "CUSTOMER", otpEnabled: true, verificationMethod: "EMAIL" },
    { role: "AGENT", otpEnabled: true, verificationMethod: "EMAIL" },
    { role: "EMPLOYEE", otpEnabled: true, verificationMethod: "EMAIL" },
    { role: "ADMIN", otpEnabled: false, verificationMethod: "NONE" },
    { role: "SUPER_ADMIN", otpEnabled: false, verificationMethod: "NONE" },
  ];

  for (const config of roleConfigs) {
    await prisma.roleConfig.upsert({
      where: { role: config.role },
      update: config,
      create: config,
    });
  }
  console.log("✅ RoleConfig seeded");

  // Seed AppConfig
  const appConfigs = [
    { key: "jwt_secret", value: "tia-insurance-secret-key-2024", group: "security" },
    { key: "otp_length", value: "6", group: "otp" },
    { key: "otp_expiry_sec", value: "300", group: "otp" },
    { key: "company_name", value: "TIA Insurance", group: "general" },
    { key: "company_email", value: "support@tia-insurance.com", group: "general" },
  ];

  for (const config of appConfigs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }
  console.log("✅ AppConfig seeded");

  // Create a default admin user if not exists
  const adminEmail = "admin@tia-insurance.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "System Admin",
        role: "ADMIN",
        isVerified: true,
      },
    });
    console.log("✅ Default admin user created (admin@tia-insurance.com / admin123)");
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });