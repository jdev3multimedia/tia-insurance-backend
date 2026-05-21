import prisma from "../config/prisma.js";

/**
 * =========================================================
 * IAR SECTION RATE MASTER
 * =========================================================
 */

const SECTION_RATES = {

  /**
   * Machinery Breakdown
   * Rate upon 1,000
   */

  machinery_breakdown: {
    rate: 0.25,
    basis: 1000
  },

  /**
   * MLOP
   * Rate upon 1,000
   */

  mlop: {
    rate: 1,
    basis: 1000
  }
};

/**
 * =========================================================
 * ROUND FUNCTION
 * =========================================================
 */

const round2 = (n = 0) =>
  Number(Number(n).toFixed(2));

/**
 * =========================================================
 * GENERIC PREMIUM CALCULATOR
 * =========================================================
 */

const calculatePremium = ({
  sumInsured = 0,
  rate = 0,
  basis = 1000
}) => {

  return round2(
    (
      Number(sumInsured) *
      Number(rate)
    ) / Number(basis)
  );
};

/**
 * =========================================================
 * SECTION LOGGER
 * =========================================================
 */

const logSection = ({
  section,
  sumInsured,
  rate,
  basis,
  premium
}) => {

  console.log(`
=========================================================
SECTION : ${section}
---------------------------------------------------------
SUM INSURED : ${sumInsured}
RATE        : ${rate}
BASIS       : ${basis}
PREMIUM     : ${premium}
=========================================================
  `);
};

/**
 * =========================================================
 * MAIN CONTROLLER
 * =========================================================
 */

export const calculateIARInsurancePremium =
  async (data) => {

    try {

      console.log(`
=========================================================
START IAR INSURANCE PREMIUM CALCULATION
=========================================================
      `);

      console.log(
        "[INPUT DATA]",
        JSON.stringify(data, null, 2)
      );

      /**
       * =========================================================
       * INPUTS
       * =========================================================
       */

      const {
        customerDetails,
        riskCovers,
        discounts,
        sumInsured,
        sections
      } = data;

      /**
       * =========================================================
       * CUSTOMER DETAILS
       * =========================================================
       */

      const {
        customerName,
        pinCode,
        riskCode,
        occupancy
      } = customerDetails;

      /**
       * =========================================================
       * RISK COVERS
       * =========================================================
       */

      const {
        fireAndAlliedPerils,
        terrorism,
        burglary,
        businessInterruption,
        machineryBreakdown,
        mlop
      } = riskCovers;

      /**
       * =========================================================
       * DISCOUNTS
       * =========================================================
       */

      const {
        iibDiscountPercent = 0,
        natcatDiscountPercent = 0
      } = discounts;

      /**
       * =========================================================
       * TOTAL SUM INSURED
       * =========================================================
       */

      const totalSI =
        Number(sumInsured.buildingSI || 0) +
        Number(sumInsured.plantAndMachinerySI || 0) +
        Number(sumInsured.stockSI || 0) +
        Number(
          sumInsured.furnitureFixturesFittingsSI || 0
        ) +
        Number(sumInsured.otherContentsSI || 0);

      console.log(`
=========================================================
TOTAL SUM INSURED
---------------------------------------------------------
${totalSI}
=========================================================
      `);

      /**
       * =========================================================
       * FETCH MASTER RATES
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

      console.log(`
=========================================================
MASTER RATES
---------------------------------------------------------
IIB RATE        : ${iibRate}
STFI RATE       : ${stfiRate}
TERRORISM RATE  : ${terrorismRate}
=========================================================
      `);

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

      console.log(`
=========================================================
EARTHQUAKE RATE
---------------------------------------------------------
OCCUPANCY CATEGORY : ${occupancyCategory}
EARTHQUAKE RATE    : ${earthquakeRate}
=========================================================
      `);

      /**
       * =========================================================
       * FIRE RATE CALCULATION
       * =========================================================
       */

      let netRateIIB = 0;

      let netCatRate = 0;

      let terrorismApplied = 0;

      let finalFireRate = 0;

      if (fireAndAlliedPerils) {

        /**
         * IIB RATE AFTER DISCOUNT
         */

        netRateIIB =
          round2(
            iibRate -
            (
              iibRate *
              iibDiscountPercent / 100
            )
          );

        /**
         * NATCAT RATE
         * EQ + STFI
         */

        const natcatBaseRate =
          earthquakeRate +
          stfiRate;

        netCatRate =
          round2(
            natcatBaseRate -
            (
              natcatBaseRate *
              natcatDiscountPercent / 100
            )
          );

        /**
         * TERRORISM
         */

        terrorismApplied =
          terrorism
            ? terrorismRate
            : 0;

        /**
         * FINAL FIRE RATE
         */

        finalFireRate =
          round2(
            netRateIIB +
            netCatRate +
            terrorismApplied
          );
      }

      console.log(`
=========================================================
FIRE RATE BREAKUP
---------------------------------------------------------
NET IIB RATE      : ${netRateIIB}
NET CAT RATE      : ${netCatRate}
TERRORISM RATE    : ${terrorismApplied}
FINAL FIRE RATE   : ${finalFireRate}
=========================================================
      `);

      /**
       * =========================================================
       * FIRE & ALLIED PERILS
       * =========================================================
       */

      let firePremium = 0;

      if (fireAndAlliedPerils) {

        firePremium =
          calculatePremium({
            sumInsured: totalSI,
            rate: finalFireRate,
            basis: 1000
          });
      }

      logSection({
        section: "FIRE & ALLIED PERILS",
        sumInsured: totalSI,
        rate: finalFireRate,
        basis: 1000,
        premium: firePremium
      });

      /**
       * =========================================================
       * BUSINESS INTERRUPTION
       * =========================================================
       */

      let businessInterruptionPremium = 0;

      const businessInterruptionSI =
        Number(
          sections.section2
            ?.businessInterruptionSI || 0
        );

      if (
        businessInterruption &&
        businessInterruptionSI > 0
      ) {

        businessInterruptionPremium =
          calculatePremium({
            sumInsured:
              businessInterruptionSI,
            rate: finalFireRate,
            basis: 1000
          });
      }

      logSection({
        section: "BUSINESS INTERRUPTION",
        sumInsured:
          businessInterruptionSI,
        rate: finalFireRate,
        basis: 1000,
        premium:
          businessInterruptionPremium
      });

      /**
       * =========================================================
       * MACHINERY BREAKDOWN
       * =========================================================
       */

      let machineryBreakdownPremium = 0;

      const machineryBreakdownSI =
        Number(
          sections.section3A
            ?.machineryBreakdownSI || 0
        );

      if (
        machineryBreakdown &&
        machineryBreakdownSI > 0
      ) {

        machineryBreakdownPremium =
          calculatePremium({
            sumInsured:
              machineryBreakdownSI,
            rate:
              SECTION_RATES
                .machinery_breakdown.rate,
            basis:
              SECTION_RATES
                .machinery_breakdown.basis
          });
      }

      logSection({
        section: "MACHINERY BREAKDOWN",
        sumInsured:
          machineryBreakdownSI,
        rate:
          SECTION_RATES
            .machinery_breakdown.rate,
        basis:
          SECTION_RATES
            .machinery_breakdown.basis,
        premium:
          machineryBreakdownPremium
      });

      /**
       * =========================================================
       * MLOP
       * =========================================================
       */

      let mlopPremium = 0;

      const mlopSI =
        Number(
          sections.section3B
            ?.mlopSI || 0
        );

      if (
        mlop &&
        mlopSI > 0
      ) {

        mlopPremium =
          calculatePremium({
            sumInsured: mlopSI,
            rate:
              SECTION_RATES.mlop.rate,
            basis:
              SECTION_RATES.mlop.basis
          });
      }

      logSection({
        section: "MLOP",
        sumInsured: mlopSI,
        rate:
          SECTION_RATES.mlop.rate,
        basis:
          SECTION_RATES.mlop.basis,
        premium: mlopPremium
      });

      /**
       * =========================================================
       * NET PREMIUM
       * =========================================================
       */

      const netPremium =
        round2(
          firePremium +
          businessInterruptionPremium +
          machineryBreakdownPremium +
          mlopPremium
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

      /**
       * =========================================================
       * GROSS PREMIUM
       * =========================================================
       */

      const grossPremium =
        round2(
          netPremium + gst
        );

      console.log(`
=========================================================
FINAL PREMIUM SUMMARY
---------------------------------------------------------
NET PREMIUM   : ${netPremium}
GST @18%      : ${gst}
GROSS PREMIUM : ${grossPremium}
=========================================================
      `);

      /**
       * =========================================================
       * RESPONSE
       * =========================================================
       */

      return {

        customerName,

        riskCode,

        occupancy,

        totalSI,

        rates: {

          iibRate,

          earthquakeRate,

          stfiRate,

          terrorismRate,

          finalFireRate
        },

        premiums: {

          fireAndAlliedPerils:
            round2(firePremium),

          businessInterruption:
            round2(
              businessInterruptionPremium
            ),

          machineryBreakdown:
            round2(
              machineryBreakdownPremium
            ),

          mlop:
            round2(mlopPremium)
        },

        summary: {

          netPremium:
            round2(netPremium),

          gst:
            round2(gst),

          grossPremium:
            round2(grossPremium)
        }
      };

    } catch (error) {

      console.error(`
=========================================================
IAR PREMIUM CALCULATION ERROR
=========================================================
      `);

      console.error(error);

      throw new Error(
        error.message ||
        "Premium calculation failed"
      );
    }
  };