import prisma from "../config/prisma.js";

/**
 * =========================================================
 * DECIMAL CONFIG
 * =========================================================
 */

const DECIMAL_PLACES =
  Number(process.env.DECIMAL_PLACES || 2);

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

const roundValue = (n = 0) =>
  Number(
    Number(n).toFixed(DECIMAL_PLACES)
  );

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

  return roundValue(
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
        optionalCovers,
        discounts,
        sumInsured,
        sections,
        addons
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
       * OPTIONAL COVERS
       * =========================================================
       */

      const {
        terrorism = false,
        mlop = false
      } = optionalCovers || {};

      /**
       * =========================================================
       * DEFAULT MANDATORY COVERS
       * =========================================================
       */

      const fireAndAlliedPerils = true;

      const businessInterruption = true;

      const machineryBreakdown = true;

      /**
       * =========================================================
       * DISCOUNTS
       * =========================================================
       */

      const {
        iibDiscountPercent = 0,
        eqDiscountPercent = 0,
        stfiDiscountPercent = 0,
      } = discounts || {};

      /**
       * =========================================================
       * TOTAL SUM INSURED
       * =========================================================
       */

      const totalSI =
        Number(sumInsured?.buildingSI || 0) +
        Number(sumInsured?.plantAndMachinerySI || 0) +
        Number(sumInsured?.stockSI || 0) +
        Number(
          sumInsured?.furnitureFixturesFittingsSI || 0
        ) +
        Number(sumInsured?.otherContentsSI || 0);

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

         if (
          pinCode === null ||
          pinCode === undefined ||
          pinCode === ""
        ) {

          throw new Error(
            "Pincode is required"
          );
        }

        if (
          riskCode === null ||
          riskCode === undefined ||
          riskCode === ""
        ) {

          throw new Error(
            "Risk code is required"
          );
        }


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

      let netEqRate = 0;
      
      let netStfiRate = 0;  

      let terrorismApplied = 0;

      let finalFireRate = 0;

      if (fireAndAlliedPerils) {

        /**
         * IIB RATE AFTER DISCOUNT
         */

        netRateIIB =
          roundValue(
            iibRate -
            (
              iibRate *
              Number(iibDiscountPercent) / 100
            )
          );
        

        /**
         * NATCAT RATE
         * EQ + STFI
         */

        /**
 * =========================================================
 * EQ RATE AFTER DISCOUNT
 * =========================================================
 */

netEqRate =
  roundValue(
    earthquakeRate -
    (
      earthquakeRate *
      Number(eqDiscountPercent) /
      100
    )
  );

/**
 * =========================================================
 * STFI RATE AFTER DISCOUNT
 * =========================================================
 */

netStfiRate =
  roundValue(
    stfiRate -
    (
      stfiRate *
      Number(stfiDiscountPercent) /
      100
    )
  );

/**
 * =========================================================
 * NET NAT CAT RATE
 * =========================================================
 */

netCatRate =
  roundValue(
    netEqRate +
    netStfiRate
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
          roundValue(
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
NET EQ RATE       : ${netEqRate}
NET STFI RATE     : ${netStfiRate}
NET NAT CAT RATE  : ${netCatRate}
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

      firePremium =
        calculatePremium({
          sumInsured: totalSI,
          rate: finalFireRate,
          basis: 1000
        });

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
          sections?.section2
            ?.businessInterruptionSI || 0
        );

      if (businessInterruptionSI > 0) {

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
          sections?.section3A
            ?.machineryBreakdownSI || 0
        );

      if (machineryBreakdownSI > 0) {

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
          sections?.section3B
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
        roundValue(
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
        roundValue(
          netPremium * 0.18
        );

      /**
       * =========================================================
       * GROSS PREMIUM
       * =========================================================
       */

      const grossPremium =
        roundValue(
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


      // #QS BUILD SAVE PAYLOAD
const savePayload = {
  quoteNo: `IAR-${Date.now()}`, // #QS auto quote number
  customerName,
  address: customerDetails.address,
  pinCode,
  riskCode,
  occupancy,

  terrorism,
  mlop,

  discounts,

  sumInsured,
  sections,

  totalSI,

  rates: {
    iibRate,
    earthquakeRate,
    stfiRate,
    netIibRate: netRateIIB,
    netEqRate,
    netStfiRate,
    netNatCatRate: netCatRate,
    terrorismRate,
    finalFireRate
  },

  premiums: {
    fireAndAlliedPerils: firePremium,
    businessInterruption: businessInterruptionPremium,
    machineryBreakdown: machineryBreakdownPremium,
    mlop: mlopPremium
  },

  summary: {
    netPremium,
    gst,
    grossPremium
  },

  addons : addons
};



// #QS DB SAVE CALL
const savedQuote = await saveIarQuote(savePayload);




      /**
       * =========================================================
       * RESPONSE
       * =========================================================
       */

      return {
              
        quoteNo: savedQuote.quoteNo,

        customerName,

        riskCode,

        occupancy,

        totalSI:

          roundValue(totalSI),

        rates: {

  iibRate:
    roundValue(iibRate),

  earthquakeRate:
    roundValue(earthquakeRate),

  stfiRate:
    roundValue(stfiRate),

  netIibRate:
    roundValue(netRateIIB),

  netEqRate:
    roundValue(netEqRate),

  netStfiRate:
    roundValue(netStfiRate),

  netNatCatRate:
    roundValue(netCatRate),

  terrorismRate:
    roundValue(terrorismRate),

  finalFireRate:
    roundValue(finalFireRate)
},
        premiums: {

          fireAndAlliedPerils:
            roundValue(firePremium),

          businessInterruption:
            roundValue(
              businessInterruptionPremium
            ),

          machineryBreakdown:
            roundValue(
              machineryBreakdownPremium
            ),

          mlop:
            roundValue(mlopPremium)
        },

        summary: {

          netPremium:
            roundValue(netPremium),

          gst:
            roundValue(gst),

          grossPremium:
            roundValue(grossPremium)
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


  /**
 * =========================================================
 * #QS SAVE HELPER FUNCTION
 * =========================================================
 */

const dbValue = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  return value;
};

const saveIarQuote = async (payload) => {
  try {
    return await prisma.iarQuote.create({
      data: {
        // BASIC INFO
        quoteNo: payload.quoteNo,
        quoteType: 'iar',
        customerName: dbValue(payload.customerName),
        address: dbValue(payload.address),
        pinCode: dbValue(payload.pinCode),
        riskCode: dbValue(payload.riskCode),
        occupancy: dbValue(payload.occupancy),

        // OPTIONAL COVERS
        terrorism: payload.terrorism,
        mlop: payload.mlop,

        // DISCOUNTS
        iibDiscountPct: dbValue(
          payload.discounts?.iibDiscountPercent
        ),
        eqDiscountPct: dbValue(
          payload.discounts?.eqDiscountPercent
        ),
        stfiDiscountPct: dbValue(
          payload.discounts?.stfiDiscountPercent
        ),

        // SUM INSURED
        buildingSi: dbValue(
          payload.sumInsured?.buildingSI
        ),
        plantMachinerySi: dbValue(
          payload.sumInsured?.plantAndMachinerySI
        ),
        stockSi: dbValue(
          payload.sumInsured?.stockSI
        ),
        fffSi: dbValue(
          payload.sumInsured?.furnitureFixturesFittingsSI
        ),
        otherContentsSi: dbValue(
          payload.sumInsured?.otherContentsSI
        ),
        totalSi: dbValue(
          payload.totalSI
        ),

        // SECTION SI
        earthquakeSi: dbValue(
          payload.sections?.section1?.earthquakeSI
        ),
        stfiSi: dbValue(
          payload.sections?.section1?.stfiSI
        ),
        terrorismSi: dbValue(
          payload.sections?.section1?.terrorismSI
        ),

        businessInterruptionSi: dbValue(
          payload.sections?.section2?.businessInterruptionSI
        ),

        machineryBreakdownSi: dbValue(
          payload.sections?.section3A?.machineryBreakdownSI
        ),

        mlopSi: dbValue(
          payload.sections?.section3B?.mlopSI
        ),

        // RATES
        iibRate: dbValue(payload.rates?.iibRate),
        earthquakeRate: dbValue(payload.rates?.earthquakeRate),
        stfiRate: dbValue(payload.rates?.stfiRate),
        netIibRate: dbValue(payload.rates?.netIibRate),
        netEqRate: dbValue(payload.rates?.netEqRate),
        netStfiRate: dbValue(payload.rates?.netStfiRate),
        netNatCatRate: dbValue(payload.rates?.netNatCatRate),
        terrorismRate: dbValue(payload.rates?.terrorismRate),
        finalFireRate: dbValue(payload.rates?.finalFireRate),

        // PREMIUMS
        firePremium: dbValue(
          payload.premiums?.fireAndAlliedPerils
        ),
        biPremium: dbValue(
          payload.premiums?.businessInterruption
        ),
        mbPremium: dbValue(
          payload.premiums?.machineryBreakdown
        ),
        mlopPremium: dbValue(
          payload.premiums?.mlop
        ),

        netPremium: dbValue(
          payload.summary?.netPremium
        ),
        gst: dbValue(
          payload.summary?.gst
        ),
        grossPremium: dbValue(
          payload.summary?.grossPremium
        ),

        // ADDONS
        addons:
          payload.addons?.length > 0
            ? payload.addons
            : null
            
      }
    });
  } catch (err) {
    console.error("#QS SAVE ERROR", err);
    throw new Error("Failed to save IAR quote");
  }
};