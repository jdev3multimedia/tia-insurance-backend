import prisma from "../config/prisma.js";

const DECIMAL_PLACES =
  Number(
    process.env.DECIMAL_PLACES || 2
  );


  /**
 * ==================================================
 * ROUND FUNCTION
 * ==================================================
 */

const roundValue = (n = 0) =>
  Number(
    Number(n).toFixed(
      DECIMAL_PLACES
    )
  );

export const calculateFireInsurancePremium = async (
  data
) => {
  // ==================================================
  // HELPER FUNCTIONS
  // ==================================================

  const round3 = (n = 0) =>
    Math.round(Number(n) * 1000) / 1000;

  const round2 = (n = 0) =>
    Math.round(Number(n) * 100) / 100;

  // const round2 = (n = 0) =>
  //   Math.round(Number(n) * 100) / 100;


  const toNum = (value) =>
    parseFloat(String(value || 0).replace(/,/g, "")) ||
    0;

  console.log(
    "=================================================="
  );
  console.log(
    "FIRE INSURANCE PREMIUM CALCULATION STARTED"
  );
  console.log(
    "=================================================="
  );

  try {
    // ==================================================
    // INPUT DATA
    // ==================================================

    const {
      customerDetails = {},
      riskCovers = {},
      discounts = {},
      sumInsured = {}
    } = data;

    console.log("INPUT DATA RECEIVED");

    console.log("Customer Details:", customerDetails);
    console.log("Customer Details:", customerDetails);

    console.log("Risk Covers:", riskCovers);
    console.log("Risk Covers:", riskCovers);

    console.log("Discounts:", discounts);

    console.log("Sum Insured:", sumInsured);

    const {
      riskCode = "",
      occupancy = "",
      pinCode = ""
    } = customerDetails;

    const {
      terrorism = false,
      burglary = false
    } = riskCovers;

    const {
      iibDiscountPercent = 0,
      eqDiscountPercent = 0,
      stfiDiscountPercent = 0
    } = discounts;

    const {
      buildingSI = 0,
      plantAndMachinerySI = 0,
      stockSI = 0,
      furnitureFixturesFittingsSI = 0,
      otherContentsSI = 0
    } = sumInsured;

    // ==================================================
    // VALIDATION
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log("VALIDATING INPUTS");
    console.log(
      "--------------------------------------------------"
    );

    if (!riskCode.trim()) {
      console.log("ERROR: Risk code missing");
      throw new Error("Risk code is required");
    }

    if (!pinCode.trim()) {
      console.log("ERROR: Pin code missing");
      throw new Error("Pin code is required");
    }

    console.log("Risk Code:", riskCode);

    console.log("Occupancy:", occupancy);

    console.log("Pin Code:", pinCode);

    // ==================================================
    // FETCH MASTER DATA
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log("FETCHING MASTER DATA");
    console.log(
      "--------------------------------------------------"
    );

    const [occupancyData, locationData] =
      await Promise.all([
        prisma.occupancyRateMaster.findFirst({
          where: {
            risk_code: riskCode
          }
        }),

        prisma.locationRateMaster.findFirst({
          where: {
            pincode: pinCode
          }
        })
      ]);

    if (!occupancyData) {
      console.log(
        "ERROR: Occupancy master data not found"
      );

      throw new Error(
        "Invalid risk code. Occupancy data not found"
      );
    }

    if (!locationData) {
      console.log(
        "ERROR: Location master data not found"
      );

      throw new Error(
        "Invalid pincode. Location data not found"
      );
    }

    console.log(
      "Occupancy Master Data:",
      occupancyData
    );

    console.log(
      "Location Master Data:",
      locationData
    );

    // ==================================================
    // SUM INSURED CALCULATION
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log("CALCULATING SUM INSURED");
    console.log(
      "--------------------------------------------------"
    );

    const buildingSumInsured = toNum(buildingSI);

    const plantAndMachinerySumInsured = toNum(
      plantAndMachinerySI
    );

    const stockSumInsured = toNum(stockSI);

    const furnitureFixturesFittingsSumInsured =
      toNum(furnitureFixturesFittingsSI);

    const otherContentsSumInsured = toNum(
      otherContentsSI
    );

    console.log(
      "Building Sum Insured:",
      buildingSumInsured
    );

    console.log(
      "Plant & Machinery Sum Insured:",
      plantAndMachinerySumInsured
    );

    console.log(
      "Stock Sum Insured:",
      stockSumInsured
    );

    console.log(
      "Furniture Fixtures Fittings Sum Insured:",
      furnitureFixturesFittingsSumInsured
    );

    console.log(
      "Other Contents Sum Insured:",
      otherContentsSumInsured
    );

    // Fire Section SI

    const fireSectionSumInsured =
      buildingSumInsured +
      plantAndMachinerySumInsured +
      stockSumInsured +
      furnitureFixturesFittingsSumInsured +
      otherContentsSumInsured;

    // Burglary Section SI

    const burglarySectionSumInsured =
      plantAndMachinerySumInsured +
      stockSumInsured +
      furnitureFixturesFittingsSumInsured +
      otherContentsSumInsured;

    console.log(
      "Fire Section Sum Insured:",
      fireSectionSumInsured
    );

    console.log(
      "Burglary Section Sum Insured:",
      burglarySectionSumInsured
    );

    // ==================================================
    // FETCH RATES
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log("FETCHING RATES");
    console.log(
      "--------------------------------------------------"
    );

    const iibRate = Number(
      occupancyData.iib_rate || 0
    );

    const stfiRate = Number(
      occupancyData.stfi_rate || 0
    );

    const terrorismRate = Number(
      occupancyData.terrorism_rate || 0
    );

    const bhbRate = Number(
      occupancyData.bhb_rate || 0.05
    );


    console.log("IIB Rate:", iibRate);

    console.log("STFI Rate:", stfiRate);

    console.log(
      "Terrorism Rate:",
      terrorismRate
    );

    console.log("BHB Rate:", bhbRate);

    // ==================================================
    // EARTHQUAKE RATE CALCULATION
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log(
      "CALCULATING EARTHQUAKE RATE"
    );
    console.log(
      "--------------------------------------------------"
    );

    let earthquakeRate = 0;

    const occupancyCategory =
      occupancyData.occupancy_category
        ?.toLowerCase()
        ?.replace(/\s+/g, "")
        ?.replace(/-/g, "");

    console.log(
      "Normalized Occupancy Category:",
      occupancyCategory
    );

    if (occupancyCategory === "dwelling") {
      earthquakeRate = Number(
        locationData.dwelling_rate || 0
      );
    } else if (
      occupancyCategory === "nonindustrial"
    ) {
      earthquakeRate = Number(
        locationData.non_industrial_rate || 0
      );
    } else if (
      occupancyCategory === "industrial"
    ) {
      earthquakeRate = Number(
        locationData.industrial_rate || 0
      );
    }

    console.log(
      "Earthquake Rate:",
      earthquakeRate
    );

    // ==================================================
    // RATE CALCULATIONS
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log("CALCULATING RATES");
    console.log(
      "--------------------------------------------------"
    );

    console.log(
      "IIB Discount Percentage:",
      iibDiscountPercent
    );

    const netIIBRate = round3(
      iibRate -
        (iibRate * iibDiscountPercent) / 100
    );

    console.log(
      "Net IIB Rate:",
      netIIBRate
    );

console.log(
  "EQ Discount Percentage:",
  eqDiscountPercent
);

const netEqRate = roundValue(
  earthquakeRate -
    (
      earthquakeRate *
      eqDiscountPercent
    ) / 100
);

console.log(
  "Net EQ Rate:",
  netEqRate
);

console.log(
  "STFI Discount Percentage:",
  stfiDiscountPercent
);

const netStfiRate = roundValue(
  stfiRate -
    (
      stfiRate *
      stfiDiscountPercent
    ) / 100
);

console.log(
  "Net STFI Rate:",
  netStfiRate
);

const netCatRate = roundValue(
  netEqRate +
  netStfiRate
);

console.log(
  "Net Catastrophe Rate:",
  netCatRate
);
    const finalFireRate = round3(
      netIIBRate + netCatRate
    );

    console.log(
      "Final Fire Rate:",
      finalFireRate
    );

    const totalFireRate = round3(
      finalFireRate + terrorismRate
    );

    console.log(
      "Total Fire Rate:",
      totalFireRate
    );

    // ==================================================
    // FIRE PREMIUM CALCULATION
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log(
      "CALCULATING FIRE PREMIUM"
    );
    console.log(
      "--------------------------------------------------"
    );

    const firePremium = round2(
      (fireSectionSumInsured *
        finalFireRate) /
        1000
    );

    console.log(
      "Fire Premium:",
      firePremium
    );

    let terrorismPremium = 0;

    if (terrorism) {
      terrorismPremium = round2(
        (fireSectionSumInsured *
          terrorismRate) /
          1000
      );
    }

    console.log(
      "Terrorism Cover Selected:",
      terrorism
    );

    console.log(
      "Terrorism Premium:",
      terrorismPremium
    );

    const fireSectionPremium = round2(
      firePremium + terrorismPremium
    );

    console.log(
      "Fire Section Premium:",
      fireSectionPremium
    );

// ==================================================
// BURGLARY PREMIUM CALCULATION
// ==================================================

console.log("--------------------------------------------------");
console.log("CALCULATING BURGLARY PREMIUM");
console.log("--------------------------------------------------");

let burglaryPremium = 0;

if (burglary) {
  let burglaryAppliedRate =
    burglarySectionSumInsured < 50000000
      ? bhbRate
      : 0.01;

  burglaryPremium = roundValue(
    (burglarySectionSumInsured * burglaryAppliedRate) / 1000
  );

  console.log(
    "Burglary Applied Rate:",
    burglaryAppliedRate
  );
  console.log(
    "Burglary Premium:",
    burglaryPremium
  );
} else {
  console.log("Burglary cover not selected.");
  console.log("Burglary Premium:", burglaryPremium);
}
    // ==================================================
    // FINAL PREMIUM CALCULATION
    // ==================================================

    console.log(
      "--------------------------------------------------"
    );
    console.log(
      "CALCULATING FINAL PREMIUMS"
    );
    console.log(
      "--------------------------------------------------"
    );

    const netPremium = round2(
      fireSectionPremium + burglaryPremium
    );

    console.log(
      "Net Premium:",
      netPremium
    );

    const gst = round2(netPremium * 0.18);

    console.log("GST @18%:", gst);

    const grossPremium = round2(
      netPremium + gst
    );

    console.log(
      "Gross Premium:",
      grossPremium
    );

    console.log(
      "=================================================="
    );
    console.log(
      "FIRE INSURANCE PREMIUM CALCULATION COMPLETED"
    );
    console.log(
      "=================================================="
    );

    // ==================================================
    // FINAL RESPONSE
    // ==================================================

    return {
      customerDetails: {
        riskCode,
        occupancy,
        pinCode
      },

      rates: {
        iibRate,
        netIIBRate,

        earthquakeRate,

        stfiRate,

        netEqRate,
        netStfiRate,

        netCatRate,

        finalFireRate,

        // terrorismRate,

        ...(terrorism && {
          terrorismRate: roundValue(terrorismRate),
        }),

        totalFireRate,

        bhbRate
      },

      sumInsured: {
        buildingSumInsured,

        plantAndMachinerySumInsured,

        stockSumInsured,

        furnitureFixturesFittingsSumInsured,

        otherContentsSumInsured,

        fireSectionSumInsured,

        burglarySectionSumInsured
      },

      premium: {
        firePremium,

        terrorismPremium,

        fireSectionPremium,

        burglaryPremium,

        netPremium,

        gst,

        grossPremium
      }
    };
  } catch (error) {
    console.log(
      "=================================================="
    );
    console.log(
      "PREMIUM CALCULATION FAILED"
    );
    console.log(
      "=================================================="
    );

    console.log("Error Message:", error.message);

    throw error;
  }
};