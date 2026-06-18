import prisma from "../config/prisma.js";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import QRCode from "qrcode";

import ExcelJS from "exceljs";

/**
 * ==============================
 * SAFE BIGINT HANDLER
 * ==============================
 */
const toBigInt = (id) => BigInt(id);

/**
 * ==============================
 * ADDON PARSER (SAFE)
 * ==============================
 */
const parseAddons = (addons) => {
  if (!addons) return [];

  if (Array.isArray(addons)) return addons;

  if (typeof addons === "object") return [addons];

  if (typeof addons === "string") {
    try {
      return JSON.parse(addons);
    } catch {
      return [];
    }
  }

  return [];
};

/**
 * ==============================
 * ADDON ENRICHMENT (MASTER DATA)
 * ==============================
 */
const enrichAddons = async (addons) => {
  const parsed = parseAddons(addons);

  if (!parsed.length) return [];

  const ids = parsed
    .map((a) => a?.id)
    .filter(Boolean)
    .map((id) => toBigInt(id));

  const dbAddons = await prisma.policyAddons.findMany({
    where: {
      id: { in: ids },
    },
  });

  return parsed.map((a, index) => {
    const db = dbAddons.find(
      (d) => d.id.toString() === String(a.id)
    );

    return {
      srNo: index + 1,
      addonId: a.id,
      value: a.value || 0,

      addonName: db?.addonName || "-",
      remarksSi: db?.remarksSi || "-",
      insurerRemarks: db?.insurerRemarks || "-",
      wording: db?.wording || "-",
    };
  });
};

/**
 * ==============================
 * MAIN EXPORT DATA BUILDER
 * ==============================
 */
const getExportData = async (id) => {
  const quote = await prisma.iarQuote.findUnique({
    where: {
      id: toBigInt(id),
    },
  });

  if (!quote) return null;

  const addons = await enrichAddons(quote.addons);

  return {
    quote,
    addons,
  };
};

/**
 * ==============================
 * HELPERS
 * ==============================
 */
const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

/**
 * ==============================
 * PDF GENERATOR (PUPPETEER)
 * ==============================
 */
// export const generateQuotationPdf = async (id) => {
//   const data = await getExportData(id);

//   if (!data) return null;

//   const templatePath = path.join(
//     process.cwd(),
//     "templates",
//     "quotation-pdf.html"
//   );

//   let html = fs.readFileSync(templatePath, "utf8");

//   const q = data.quote;
//   const addons = data.addons || [];

//   const addonRows =
//     addons.length > 0
//       ? addons
//           .map(
//             (a) => `
//             <tr>
//               <td style="text-align:center;">${a.srNo}</td>
//               <td>${a.addonName}</td>
//               <td>${a.remarksSi}</td>
//               <td>${a.insurerRemarks}</td>
//               <td>${a.wording}</td>
//             </tr>
//           `
//           )
//           .join("")
//       : `
//         <tr>
//           <td colspan="5" style="text-align:center;">
//             No Addons Selected
//           </td>
//         </tr>
//       `;

//   const replacements = {
//     quoteNo: q.quoteNo,
//     customerName: q.customerName,
//     address: q.address,
//     pinCode: q.pinCode,

//     riskCode: q.riskCode,
//     occupancy: q.occupancy,

//     terrorism: q.terrorism ? "Yes" : "No",
//     mlop: q.mlop ? "Yes" : "No",

//     createdAt: formatDate(q.createdAt),
//     updatedAt: formatDate(q.updatedAt),

//     isPdfExported: q.isPdfExported ? "Yes" : "No",
//     isExcelExported: q.isExcelExported ? "Yes" : "No",

//     buildingSi: formatNumber(q.buildingSi),
//     plantMachinerySi: formatNumber(q.plantMachinerySi),
//     stockSi: formatNumber(q.stockSi),
//     fffSi: formatNumber(q.fffSi),
//     otherContentsSi: formatNumber(q.otherContentsSi),

//     totalSi: formatNumber(q.totalSi),

//     earthquakeSi: formatNumber(q.earthquakeSi),
//     stfiSi: formatNumber(q.stfiSi),
//     terrorismSi: formatNumber(q.terrorismSi),
//     businessInterruptionSi: formatNumber(
//       q.businessInterruptionSi
//     ),
//     machineryBreakdownSi: formatNumber(
//       q.machineryBreakdownSi
//     ),
//     mlopSi: formatNumber(q.mlopSi),

//     iibRate: Number(q.iibRate || 0).toFixed(4),
//     earthquakeRate: Number(q.earthquakeRate || 0).toFixed(4),
//     stfiRate: Number(q.stfiRate || 0).toFixed(4),

//     netIibRate: Number(q.netIibRate || 0).toFixed(4),
//     netEqRate: Number(q.netEqRate || 0).toFixed(4),
//     netStfiRate: Number(q.netStfiRate || 0).toFixed(4),
//     netNatCatRate: Number(q.netNatCatRate || 0).toFixed(4),

//     terrorismRate: Number(q.terrorismRate || 0).toFixed(4),
//     finalFireRate: Number(q.finalFireRate || 0).toFixed(4),

//     iibDiscountPct: Number(q.iibDiscountPct || 0).toFixed(2),
//     eqDiscountPct: Number(q.eqDiscountPct || 0).toFixed(2),
//     stfiDiscountPct: Number(q.stfiDiscountPct || 0).toFixed(2),

//     firePremium: formatNumber(q.firePremium),
//     biPremium: formatNumber(q.biPremium),
//     mbPremium: formatNumber(q.mbPremium),
//     mlopPremium: formatNumber(q.mlopPremium),

//     netPremium: formatNumber(q.netPremium),
//     gst: formatNumber(q.gst),
//     grossPremium: formatNumber(q.grossPremium),

//     addonsCount: addons.length,
//     addonRows,
//   };

//   const qrCode = await QRCode.toDataURL(q.quoteNo, {
//     width: 120,
//     margin: 1,
//   });


//   console.log("Generated QR Code:", qrCode); return;


//   Object.entries(replacements).forEach(([key, value]) => {
//     html = html.replaceAll(
//       `{{${key}}}`,
//       String(value ?? "-")
//     );
//   });

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//     ],
//   });

//   try {
//     const page = await browser.newPage();

//     await page.setContent(html, {
//       waitUntil: "networkidle0",
//     });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: {
//         top: "10mm",
//         right: "10mm",
//         bottom: "10mm",
//         left: "10mm",
//       },
//     });

//     return pdfBuffer;
//   } finally {
//     await browser.close();
//   }
// };


export const generateQuotationPdf = async (id) => {
  const data = await getExportData(id);

  if (!data) return null;

  const templatePath = path.join(
    process.cwd(),
    "templates",
    "quotation-pdf.html"
  );

  let html = fs.readFileSync(templatePath, "utf8");

  const q = data.quote;
  const addons = data.addons || [];

  // QR CODE
  const qrCode = await QRCode.toDataURL(q.quoteNo, {
    width: 120,
    margin: 1,
  });

  const addonRows =
    addons.length > 0
      ? addons
          .map(
            (a) => `
            <tr>
              <td style="text-align:center;">${a.srNo}</td>
              <td>${a.addonName}</td>
              <td>${a.remarksSi}</td>
              <td>${a.insurerRemarks}</td>
              <td>${a.wording}</td>
            </tr>
          `
          )
          .join("")
      : `
        <tr>
          <td colspan="5" style="text-align:center;">
            No Addons Selected
          </td>
        </tr>
      `;

  const replacements = {
    // QR CODE
    qrCode,

    quoteNo: q.quoteNo,
    customerName: q.customerName,
    address: q.address,
    pinCode: q.pinCode,
    validTill: q.dueDate ? formatDate(q.dueDate) : "-",

    riskCode: q.riskCode,
    occupancy: q.occupancy,

    terrorism: q.terrorism ? "Yes" : "No",
    mlop: q.mlop ? "Yes" : "No",

    createdAt: formatDate(q.createdAt),
    updatedAt: formatDate(q.updatedAt),

    isPdfExported: q.isPdfExported ? "Yes" : "No",
    isExcelExported: q.isExcelExported ? "Yes" : "No",

    buildingSi: formatNumber(q.buildingSi),
    plantMachinerySi: formatNumber(q.plantMachinerySi),
    stockSi: formatNumber(q.stockSi),
    fffSi: formatNumber(q.fffSi),
    otherContentsSi: formatNumber(q.otherContentsSi),

    totalSi: formatNumber(q.totalSi),

    earthquakeSi: formatNumber(q.earthquakeSi),
    stfiSi: formatNumber(q.stfiSi),
    terrorismSi: formatNumber(q.terrorismSi),
    businessInterruptionSi: formatNumber(
      q.businessInterruptionSi
    ),
    machineryBreakdownSi: formatNumber(
      q.machineryBreakdownSi
    ),
    mlopSi: formatNumber(q.mlopSi),

    iibRate: Number(q.iibRate || 0).toFixed(4),
    earthquakeRate: Number(q.earthquakeRate || 0).toFixed(4),
    stfiRate: Number(q.stfiRate || 0).toFixed(4),

    netIibRate: Number(q.netIibRate || 0).toFixed(4),
    netEqRate: Number(q.netEqRate || 0).toFixed(4),
    netStfiRate: Number(q.netStfiRate || 0).toFixed(4),
    netNatCatRate: Number(q.netNatCatRate || 0).toFixed(4),

    terrorismRate: Number(q.terrorismRate || 0).toFixed(4),
    finalFireRate: Number(q.finalFireRate || 0).toFixed(4),

    iibDiscountPct: Number(q.iibDiscountPct || 0).toFixed(2),
    eqDiscountPct: Number(q.eqDiscountPct || 0).toFixed(2),
    stfiDiscountPct: Number(q.stfiDiscountPct || 0).toFixed(2),

    firePremium: formatNumber(q.firePremium),
    biPremium: formatNumber(q.biPremium),
    mbPremium: formatNumber(q.mbPremium),
    mlopPremium: formatNumber(q.mlopPremium),

    netPremium: formatNumber(q.netPremium),
    gst: formatNumber(q.gst),
    grossPremium: formatNumber(q.grossPremium),

    addonsCount: addons.length,
    addonRows,
  };

  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replaceAll(
      `{{${key}}}`,
      String(value ?? "-")
    );
  });

  // QR CODE DEBUG
  console.log(
    "QR injected:",
    html.includes("data:image/png;base64")
  );

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};


/**
 * ==============================
 * EXCEL GENERATOR (EXCELJS)
 * ==============================
 */
// export const generateQuotationExcel = async (id) => {
//   const data = await getExportData(id);

//   if (!data) return null;

//   const workbook = new ExcelJS.Workbook();

//   const sheet = workbook.addWorksheet("Quotation");

//   const q = data.quote;

//   sheet.addRow(["Quotation Export"]);
//   sheet.addRow([]);

//   sheet.addRow(["Quote No", q.quoteNo]);
//   sheet.addRow(["Customer Name", q.customerName]);
//   sheet.addRow(["Address", q.address]);
//   sheet.addRow(["Pin Code", q.pinCode]);
//   sheet.addRow(["Risk Code", q.riskCode]);
//   sheet.addRow(["Occupancy", q.occupancy]);

//   sheet.addRow([]);

//   sheet.addRow(["Financial Summary"]);
//   sheet.addRow(["Total SI", q.totalSi]);
//   sheet.addRow(["Gross Premium", q.grossPremium]);
//   sheet.addRow(["Net Premium", q.netPremium]);
//   sheet.addRow(["GST", q.gst]);

//   sheet.addRow([]);

//   sheet.addRow(["Addons"]);

//   sheet.addRow([
//     "Sr No",
//     "Addon Name",
//     "Value",
//     "Remarks SI",
//     "Insurer Remarks",
//     "Wording",
//   ]);

//   data.addons.forEach((a) => {
//     sheet.addRow([
//       a.srNo,
//       a.addonName,
//       a.value,
//       a.remarksSi,
//       a.insurerRemarks,
//       a.wording,
//     ]);
//   });

//   return workbook.xlsx.writeBuffer();
// };

export const generateQuotationExcel = async (id) => {
  const data = await getExportData(id);

  if (!data) return null;

  const q = data.quote;
  const addons = data.addons || [];

  const templatePath = path.join(
    process.cwd(),
    "templates",
    "quotation-excel.xlsx"
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const ws = workbook.getWorksheet("Quotation");

  // ──────────────────────────────────────────────
  // Build the same replacements map used for the PDF
  // ──────────────────────────────────────────────
  const replacements = {
    quoteNo: q.quoteNo,
    customerName: q.customerName,
    address: q.address,
    pinCode: q.pinCode,
    validTill: q.dueDate ? formatDate(q.dueDate) : "-",

    riskCode: q.riskCode,
    occupancy: q.occupancy,

    terrorism: q.terrorism ? "Yes" : "No",
    mlop: q.mlop ? "Yes" : "No",

    createdAt: formatDate(q.createdAt),
    updatedAt: formatDate(q.updatedAt),

    isPdfExported: q.isPdfExported ? "Yes" : "No",
    isExcelExported: q.isExcelExported ? "Yes" : "No",

    buildingSi: q.buildingSi,
    plantMachinerySi: q.plantMachinerySi,
    stockSi: q.stockSi,
    fffSi: q.fffSi,
    otherContentsSi: q.otherContentsSi,

    totalSi: q.totalSi,

    earthquakeSi: q.earthquakeSi,
    stfiSi: q.stfiSi,
    terrorismSi: q.terrorismSi,
    businessInterruptionSi: q.businessInterruptionSi,
    machineryBreakdownSi: q.machineryBreakdownSi,
    mlopSi: q.mlopSi,

    iibRate: Number(q.iibRate || 0),
    earthquakeRate: Number(q.earthquakeRate || 0),
    stfiRate: Number(q.stfiRate || 0),

    netIibRate: Number(q.netIibRate || 0),
    netEqRate: Number(q.netEqRate || 0),
    netStfiRate: Number(q.netStfiRate || 0),
    netNatCatRate: Number(q.netNatCatRate || 0),

    terrorismRate: Number(q.terrorismRate || 0),
    finalFireRate: Number(q.finalFireRate || 0),

    iibDiscountPct: Number(q.iibDiscountPct || 0),
    eqDiscountPct: Number(q.eqDiscountPct || 0),
    stfiDiscountPct: Number(q.stfiDiscountPct || 0),

    firePremium: q.firePremium,
    biPremium: q.biPremium,
    mbPremium: q.mbPremium,
    mlopPremium: q.mlopPremium,

    netPremium: q.netPremium,
    gst: q.gst,
    grossPremium: q.grossPremium,

    addonsCount: addons.length,
  };

  // Selected covers checkmarks (matches PDF "SELECTED COVERS" list order)
  const coverFlags = [
    q.terrorism, // Terrorism Cover
    q.mlop, // MLOP Cover
    q.earthquake, // Earthquake Cover
    q.stfi, // STFI Cover
    q.businessInterruption, // Business Interruption
    q.machineryBreakdown, // Machinery Breakdown
  ];
  coverFlags.forEach((flag, idx) => {
    replacements[`cover${idx + 1}Check`] = flag ? "✔" : "";
  });

  // ──────────────────────────────────────────────
  // Addon rows (template has 3 placeholder rows: addon1*, addon2*, addon3*)
  // ──────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const n = i + 1;
    const a = addons[i];
    if (a) {
      replacements[`addon${n}SrNo`] = a.srNo;
      replacements[`addon${n}Name`] = a.addonName;
      replacements[`addon${n}RemarksSi`] = a.remarksSi;
      replacements[`addon${n}InsurerRemarks`] = a.insurerRemarks;
      replacements[`addon${n}Wording`] = a.wording;
    } else {
      replacements[`addon${n}SrNo`] = "";
      replacements[`addon${n}Name`] = i === 0 ? "No Addons Selected" : "";
      replacements[`addon${n}RemarksSi`] = "";
      replacements[`addon${n}InsurerRemarks`] = "";
      replacements[`addon${n}Wording`] = "";
    }
  }

  // If more than 3 addons exist, insert extra rows after row 44 (addon row 3)
  if (addons.length > 3) {
    insertExtraAddonRows(ws, addons.slice(3), 44);
  }

  // ──────────────────────────────────────────────
  // Apply replacements to every cell in the sheet
  // ──────────────────────────────────────────────
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === "string" && cell.value.includes("{{")) {
        let cellValue = cell.value;
        let isNumeric = false;
        let numericResult = null;

        Object.entries(replacements).forEach(([key, value]) => {
          const token = `{{${key}}}`;
          if (cellValue === token) {
            // whole-cell token -> preserve type (number vs string)
            isNumeric = typeof value === "number";
            numericResult = value;
            cellValue = String(value ?? "-");
          } else if (cellValue.includes(token)) {
            cellValue = cellValue.replaceAll(token, String(value ?? "-"));
          }
        });

        if (isNumeric) {
          cell.value = numericResult;
        } else {
          cell.value = cellValue;
        }
      }
    });
  });

  // ──────────────────────────────────────────────
  // Number formats for SI / premium / rate cells
  // ──────────────────────────────────────────────
  applyNumberFormat(ws, ["E19", "E20", "E21", "E22", "E23", "E24"], "#,##0.00"); // SI details
  applyNumberFormat(ws, ["J32", "J33", "J34", "J35", "J36", "J37", "J38"], "#,##0.00"); // SI breakup
  applyNumberFormat(ws, ["E32", "E33", "E34", "E35", "E36", "E37", "E38"], "#,##0.00"); // premium

  applyNumberFormat(ws, ["G19", "G20", "G21", "G22", "G23", "G24", "G25"], "0.0000"); // rates
  applyNumberFormat(ws, ["G26"], "0.0000"); // final fire rate
  applyNumberFormat(ws, ["I19", "I20", "I21"], "0.00"); // discounts

  // ──────────────────────────────────────────────
  // Insert logo (top-left) and QR code (top-right)
  // ──────────────────────────────────────────────

  const logoPath = path.join(
    process.cwd(),
    "templates",
    "tia-full-logo-t.png"
  );

  const logoBuffer = fs.readFileSync(logoPath);


  if (logoBuffer) {
    const logoImageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });
    // Anchored over merged cell B2:D4
    ws.addImage(logoImageId, {
      tl: { col: 1, row: 1 }, // B2 (0-indexed)
      ext: { width: 220, height: 60 },
      editAs: "oneCell",
    });
  }

  const QRCode = (await import("qrcode")).default;
  const qrDataUrl = await QRCode.toDataURL(q.quoteNo, { width: 120, margin: 1 });
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrImageId = workbook.addImage({
    base64: qrBase64,
    extension: "png",
  });
  // Anchored over merged cell I2:K4
  ws.addImage(qrImageId, {
    tl: { col: 8, row: 1 }, // I2 (0-indexed)
    ext: { width: 80, height: 80 },
    editAs: "oneCell",
  });

  // ──────────────────────────────────────────────
  // Mark as exported (mirrors PDF flag pattern)
  // ──────────────────────────────────────────────
  // await markExcelExported(id); // optional - update q.isExcelExported = true in DB

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Inserts additional addon rows below the template's 3 placeholder rows,
 * copying the style of the last template row and filling in values.
 */
function insertExtraAddonRows(ws, extraAddons, lastTemplateRow) {
  let insertAt = lastTemplateRow + 1;

  extraAddons.forEach((a, idx) => {
    ws.duplicateRow(lastTemplateRow, 1, true);
    const row = ws.getRow(insertAt);
    row.height = 28;

    // re-apply merges for the new row (duplicateRow does not always merge)
    ws.mergeCells(insertAt, 3, insertAt, 4); // C:D Addon Name
    ws.mergeCells(insertAt, 5, insertAt, 6); // E:F Remarks
    ws.mergeCells(insertAt, 7, insertAt, 8); // G:H Insurer Remarks
    ws.mergeCells(insertAt, 9, insertAt, 11); // I:K Wording

    row.getCell(2).value = a.srNo;
    row.getCell(3).value = a.addonName;
    row.getCell(5).value = a.remarksSi;
    row.getCell(7).value = a.insurerRemarks;
    row.getCell(9).value = a.wording;

    insertAt++;
  });
}

function applyNumberFormat(ws, cellRefs, fmt) {
  cellRefs.forEach((ref) => {
    const cell = ws.getCell(ref);
    if (typeof cell.value === "number") {
      cell.numFmt = fmt;
    }
  });
}

async function fetchImageBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(res.data);
  } catch (err) {
    console.error("Logo fetch failed:", err.message);
    return null;
  }
}