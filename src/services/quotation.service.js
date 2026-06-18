import prisma from "../config/prisma.js";

// export const getAll = async ({
//   page,
//   limit,
//   search,
//   sortBy,
//   order,
// }) => {
//   const skip = (page - 1) * limit;

//   // only real DB columns (Prisma-safe)
//   const allowedSortFields = [
//     "id",
//     "quote_no",
//     "customer_name",
//     "total_si",
//     "gross_premium",
//     "created_at",
//     "updated_at",
//   ];

//   const safeSortBy = allowedSortFields.includes(sortBy)
//     ? sortBy
//     : "id";

//   // filters
//   const where = {
//     ...(search && {
//       OR: [
//         { quoteNo: { contains: search } },
//         { customerName: { contains: search } },
//         { address: { contains: search } },
//         { pinCode: { contains: search } },
//         { riskCode: { contains: search } },
//       ],
//     }),
//   };

//   const total = await prisma.iarQuote.count({ where });

//   const data = await prisma.iarQuote.findMany({
//     where,
//     skip,
//     take: limit,
//     orderBy: {
//       [safeSortBy]: order === "asc" ? "asc" : "desc",
//     },
//   });

//   return {
//     data,
//     pagination: {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };

export const getAll = async ({
  page,
  limit,
  search,
  sortBy,
  order,
  quoteType,
}) => {
  const skip = (page - 1) * limit;

  console.log("getAll params:", {
    page,
    limit,
    search,
    sortBy,
    order,
    quoteType,
  });

  
  const allowedSortFields = [
    "id",
    "quoteNo",
    "customerName",
    "totalSi",
    "grossPremium",
    "createdAt",
    "updatedAt",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "id";

  const allowedTypes = ["fire", "business", "iar"];

  const safeQuoteType = allowedTypes.includes(quoteType)
    ? quoteType
    : undefined;

  const where = {
    ...(safeQuoteType && {
      quoteType: safeQuoteType,
    }),

    ...(search && {
      OR: [
        { quoteNo: { contains: search } },
        { customerName: { contains: search } },
        { address: { contains: search } },
        { pinCode: { contains: search } },
        { riskCode: { contains: search } },
      ],
    }),
  };

  const total = await prisma.iarQuote.count({ where });

  const data = await prisma.iarQuote.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [safeSortBy]: order === "asc" ? "asc" : "desc",
    },
  });

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
export const getById = async (id) => {
  const quote = await prisma.iarQuote.findUnique({
    where: { id: BigInt(id) },
  });

  const BASE_URL = process.env.BASE_URL;

  console.log("Fetched quote:", quote);
  if (!quote) return null;

  return {
    quoteDetails: {
      id: quote.id.toString(),
      quoteNo: quote.quoteNo,
      customerName: quote.customerName,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    },

    riskDetails: {
      riskCode: quote.riskCode,
      occupancy: quote.occupancy,
      address: quote.address,
      pinCode: quote.pinCode,
      terrorism: quote.terrorism,
      mlop: quote.mlop,
    },

    sumInsured: {
      buildingSi: quote.buildingSi,
      plantMachinerySi: quote.plantMachinerySi,
      stockSi: quote.stockSi,
      fffSi: quote.fffSi,
      otherContentsSi: quote.otherContentsSi,
      totalSi: quote.totalSi,
      earthquakeSi: quote.earthquakeSi,
      stfiSi: quote.stfiSi,
      terrorismSi: quote.terrorismSi,
      businessInterruptionSi: quote.businessInterruptionSi,
      machineryBreakdownSi: quote.machineryBreakdownSi,
      mlopSi: quote.mlopSi,
    },

    discounts: {
      iibDiscountPct: quote.iibDiscountPct,
      eqDiscountPct: quote.eqDiscountPct,
      stfiDiscountPct: quote.stfiDiscountPct,
    },

    rates: {
      iibRate: quote.iibRate,
      earthquakeRate: quote.earthquakeRate,
      stfiRate: quote.stfiRate,
      netIibRate: quote.netIibRate,
      netEqRate: quote.netEqRate,
      netStfiRate: quote.netStfiRate,
      netNatCatRate: quote.netNatCatRate,
      terrorismRate: quote.terrorismRate,
      finalFireRate: quote.finalFireRate,
    },

    premiums: {
      firePremium: quote.firePremium,
      biPremium: quote.biPremium,
      mbPremium: quote.mbPremium,
      mlopPremium: quote.mlopPremium,
      netPremium: quote.netPremium,
      gst: quote.gst,
      grossPremium: quote.grossPremium,
    },

    addons: await enrichAddons(quote.addons),

    exports: {
      isPdfExported: quote.isPdfExported,
      isExcelExported: quote.isExcelExported,
      pdfExportedAt: quote.pdfExportedAt,
      excelExportedAt: quote.excelExportedAt,

      pdfUrl: `/api/quotations/export/${quote.id}/export/pdf`,
      excelUrl: `/api/quotations/export/${quote.id}/export/excel`,
    },
  };
};


const enrichAddons = async (addons) => {
  if (!addons) return [];

  let parsed = [];

  // case 1: string JSON
  if (typeof addons === "string") {
    try {
      parsed = JSON.parse(addons);
    } catch (err) {
      return [];
    }
  }

  // case 2: already object (Prisma Json)
  else if (Array.isArray(addons)) {
    parsed = addons;
  } else {
    return [];
  }

  if (parsed.length === 0) return [];

  // extract IDs
  const ids = parsed
    .map((a) => a?.id)
    .filter(Boolean)
    .map((id) => BigInt(id));

  // fetch addon master data
  const dbAddons = await prisma.policyAddons.findMany({
    where: {
      id: { in: ids },
    },
  });

  // merge DB + request data
  return parsed.map((a) => {
    const db = dbAddons.find(
      (d) => d.id.toString() === a.id.toString()
    );

    return {
      id: a.id,
      value: a.value,

      addonName: db?.addonName || null,
      remarksSi: db?.remarksSi || null,
      insurerRemarks: db?.insurerRemarks || null,
      wording: db?.wording || null,
    };
  });
};



// const parseAddons = (addons) => {
//   if (!addons) return [];

//   // already valid object/array
//   if (typeof addons === "object") return addons;

//   // string case
//   if (typeof addons === "string") {
//     try {
//       return JSON.parse(addons);
//     } catch (e) {
//       // fallback for broken data like "[object Object]"
//       return [];
//     }
//   }

//   return [];
// };

export const create = async (data) => {
  return prisma.iarQuote.create({
    data: {
      ...data,

      // IMPORTANT: Prisma BigInt safety (if id ever passed manually)
      id: data.id ? BigInt(data.id) : undefined,
    },
  });
};

export const update = async (id, data) => {
  const result = await prisma.iarQuote.updateMany({
    where: {
      id: BigInt(id),
    },
    data,
  });

  return result;
};

export const remove = async (id) => {
  return prisma.iarQuote.deleteMany({
    where: {
      id: BigInt(id),
    },
  });
};