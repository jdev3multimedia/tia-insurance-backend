import xlsx from "xlsx";
import prisma from "../src/config/prisma.js";
import path from "path";
import fs from "fs";

const filePath = path.resolve("files/policy-addons.xlsx");

console.log("📂 FILE PATH:", filePath);

if (!fs.existsSync(filePath)) {
  console.error("❌ File not found:", filePath);
  process.exit(1);
}

const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = xlsx.utils.sheet_to_json(sheet, {
  defval: "",
});

const clean = (v) =>
  typeof v === "string" ? v.trim() : v;

const runImport = async () => {
  try {
    console.log("🚀 Import started...");

    for (const row of rows) {
      await prisma.policyAddons.create({
        data: {
          srNo: Number(row["Sr.\nNo."] || Object.values(row)[0]),
          addonName: clean(row["Name of Product/Add-On"] || Object.values(row)[1]),
          remarksSi: clean(row["Remarks/Sum Insured"] || Object.values(row)[2]),
          insurerRemarks: clean(row["Insurer Remarks"] || Object.values(row)[3]),
          wording: null,
          isActive: true,
        },
      });
    }

    console.log("✅ Import completed");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
};

runImport();