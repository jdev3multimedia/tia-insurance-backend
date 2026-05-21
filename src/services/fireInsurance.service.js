import prisma from "../config/prisma.js";

export const calculateFireInsurancePremium =
  async (data) => {

    const round2 = (n = 0) =>
      Math.round(Number(n) * 100) / 100;

    /**
     * =========================================================
     * INPUTS
     * =========================================================
     */

    const {
      customerDetails,
      riskCovers,
      discounts,
      sumInsured
    } = data;

    /**
     * =========================================================
     * CUSTOMER DETAILS
     * =========================================================
     */

    const {
      riskCode,
      occupancy,
      pinCode
    } = customerDetails;

    /**
     * =========================================================
     * RISK COVERS
     * =========================================================
     */

    const {
      terrorism,
      burglary
    } = riskCovers;

    /**
     * =========================================================
     * DISCOUNTS
     * =========================================================
     */

    const {
      iibDiscountPercent,
      natcatDiscountPercent
    } = discounts;

    /**
     * =========================================================
     * SUM INSURED
     * =========================================================
     */

    const {
      buildingSI,
      plantAndMachinerySI,
      stockSI,
      furnitureFixturesFittingsSI,
      otherContentsSI
    } = sumInsured;

    /**
     * =========================================================
     * TOTAL SUM INSURED
     * =========================================================
     */

    const totalSumInsured =
      Number(buildingSI || 0) +
      Number(plantAndMachinerySI || 0) +
      Number(stockSI || 0) +
      Number(
        furnitureFixturesFittingsSI || 0
      ) +
      Number(otherContentsSI || 0);

    console.log(
      "[TOTAL SUM INSURED]",
      totalSumInsured
    );

    /**
   * =========================================================
   * VALIDATIONS
   * =========================================================
   */

    if (!riskCode || riskCode.trim() === "") {
      throw new Error("Risk code is required");
    }

    if (!pinCode || pinCode.trim() === "") {
      throw new Error("Pin code is required");
    }

    /**
     * =========================================================
     * FETCH MASTER DATA
     * =========================================================
     */

    const [
      occupancyData,
      locationData
    ] = await Promise.all([

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

    if (!occupancyData || !locationData) {

      throw new Error(
        "Invalid risk code or pincode"
      );
    }

    /**
     * =========================================================
     * MASTER RATES
     * =========================================================
     */

    const iibRate =
      Number(occupancyData.iib_rate || 0);

    const stfiRate =
      Number(occupancyData.stfi_rate || 0);

    const terrorismRate =
      Number(
        occupancyData.terrorism_rate || 0
      );

    console.log("[RATES]", {
      iibRate,
      stfiRate,
      terrorismRate
    });

    /**
     * =========================================================
     * EARTHQUAKE RATE
     * =========================================================
     */

    let earthquakeRate = 0;

    const occupancyCategory =
      occupancyData.occupancy_category
        ?.trim()
        ?.toLowerCase();

    console.log(
      "[OCCUPANCY CATEGORY]",
      occupancyCategory
    );

    if (occupancyCategory === "dwelling") {

      earthquakeRate =
        Number(
          locationData.dwelling_rate || 0
        );

    } else if (
      occupancyCategory ===
      "non - industrial"
    ) {

      earthquakeRate =
        Number(
          locationData.non_industrial_rate || 0
        );

    } else if (
      occupancyCategory === "industrial"
    ) {

      earthquakeRate =
        Number(
          locationData.industrial_rate || 0
        );
    }

    console.log(
      "[EARTHQUAKE RATE]",
      earthquakeRate
    );

    /**
     * =========================================================
     * IIB RATE AFTER DISCOUNT
     * =========================================================
     */

    const netIIBRate =
      round2(
        iibRate -
        (
          iibRate *
          iibDiscountPercent / 100
        )
      );

    console.log(
      "[NET IIB RATE]",
      netIIBRate
    );

    /**
     * =========================================================
     * NAT CAT RATE
     * EQ + STFI
     * =========================================================
     */

    const netCatRate =
      round2(
        (
          earthquakeRate +
          stfiRate
        ) -
        (
          (
            earthquakeRate +
            stfiRate
          ) *
          natcatDiscountPercent / 100
        )
      );

    console.log(
      "[NET CAT RATE]",
      netCatRate
    );

    /**
     * =========================================================
     * FINAL FIRE RATE
     * =========================================================
     */

    const finalFireRate =
      round2(
        netIIBRate +
        netCatRate
      );

    console.log(
      "[FINAL FIRE RATE]",
      finalFireRate
    );

    /**
     * =========================================================
     * TERRORISM RATE
     * =========================================================
     */

    const terrorismAppliedRate =
      terrorism
        ? terrorismRate
        : 0;

    console.log(
      "[TERRORISM RATE]",
      terrorismAppliedRate
    );

    /**
     * =========================================================
     * BURGLARY RATE
     * =========================================================
     */

    const burglaryRate =
      burglary
        ? 0.005
        : 0;

    console.log(
      "[BURGLARY RATE]",
      burglaryRate
    );

    /**
     * =========================================================
     * TOTAL RATE
     * =========================================================
     */

    const totalRate =
      round2(
        finalFireRate +
        terrorismAppliedRate +
        burglaryRate
      );

    console.log(
      "[TOTAL RATE]",
      totalRate
    );

    /**
     * =========================================================
     * NET PREMIUM
     * =========================================================
     */

    const netPremium =
      round2(
        (
          totalSumInsured *
          totalRate
        ) / 1000
      );

    console.log(
      "[NET PREMIUM]",
      netPremium
    );

    /**
     * =========================================================
     * GST
     * =========================================================
     */

    const gst =
      round2(
        netPremium * 0.18
      );

    console.log("[GST]", gst);

    /**
     * =========================================================
     * GROSS PREMIUM
     * =========================================================
     */

    const grossPremium =
      round2(
        netPremium + gst
      );

    console.log(
      "[GROSS PREMIUM]",
      grossPremium
    );

    console.log(
      "[END] Calculation complete"
    );

    /**
     * =========================================================
     * RESPONSE
     * =========================================================
     */

    return {

      customerDetails: {
        riskCode,
        occupancy,
        pinCode
      },

      rates: {

        iibRate,

        earthquakeRate,

        stfiRate,

        terrorismRate,

        burglaryRate,

        netIIBRate,

        netCatRate,

        finalFireRate,

        totalRate
      },

      premium: {

        totalSumInsured,

        netPremium,

        gst,

        grossPremium
      }
    };
  };