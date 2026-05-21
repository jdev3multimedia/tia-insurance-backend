import prisma from "../config/prisma.js";

//
// GET SETTINGS
//
export const getSettings = async () => {
  const appConfigs = await prisma.appConfig.findMany();
  const roleConfigs = await prisma.roleConfig.findMany();

  // Group appConfig
  const grouped = {};

  for (const item of appConfigs) {
    if (!grouped[item.group]) {
      grouped[item.group] = {};
    }

    grouped[item.group][item.key] = item.value;
  }

  return {
    appConfig: grouped,
    roleConfig: roleConfigs,
  };
};

//
// 🔹 UPDATE SETTINGS
//
export const updateSettings = async (appConfig, roleConfig) => {
  //  Update appConfig
  for (const group in appConfig) {
    for (const key in appConfig[group]) {
      await prisma.appConfig.upsert({
        where: { key },
        update: {
          value: appConfig[group][key],
          group,
        },
        create: {
          key,
          value: appConfig[group][key],
          group,
        },
      });
    }
  }

  //  Update roleConfig
  for (const roleItem of roleConfig) {
    await prisma.roleConfig.update({
      where: { role: roleItem.role },
      data: {
        otpEnabled: roleItem.otpEnabled,
        verificationMethod: roleItem.verificationMethod,
      },
    });
  }
};