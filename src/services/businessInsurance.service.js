import prisma from "../config/prisma.js";

/**
 * =========================================================
 * SECTION RATE MASTER
 * =========================================================
 * basis:
 * 1000 => upon 1,000
 * 100  => percentage
 */

const SECTION_RATES = {

  machinery_breakdown: {
    rate: 0.25,
    basis: 1000
  },

  boiler_pressure_plant: {
    rate: 1.8,
    basis: 1000
  },

  electronic_equipment_insurance: {
    rate: 0.25,
    basis: 1000
  },

  portable_equipments_insurance: {
    rate: 1,
    basis: 100
  },

  money_insurance: {
    rate: 0.5,
    basis: 100
  },

  fidelity_guarantee_insurance: {
    rate: 7.5,
    basis: 100
  },

  personal_accident_insurance: {
    rate: 1.5,
    basis: 100
  },

  business_interruption: {
    rate: 0.52,
    basis: 1000
  },

  public_liability_insurance: {
    rate: 0.036,
    basis: 1000
  },

  plate_glass: {
    rate: 0.05,
    basis: 1000
  },

  burglary: {
    rate: 0.05,
    basis: 1000
  }
};

/**
 * =========================================================
 * ROUND FUNCTION
 * =========================================================
 */

const round2 = (n) =>
  Math.round(n * 100) / 100;

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

export const calculateBusinessInsurancePremium = async (data) => {

  console.log(`
=========================================================
START BUSINESS INSURANCE PREMIUM CALCULATION
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
    address,
    pinCode,
    riskCode,
    occupancy,
    description
  } = customerDetails;

  /**
   * =========================================================
   * RISK COVERS
   * =========================================================
   */

  const {
    terrorism,
    burglary,
    machineryBreakdown,
    boilerPressurePlant,
    electronicEquipment,
    portableEquipment,
    moneyInsurance,
    fidelityGuarantee,
    personalAccident,
    businessInterruption,
    publicLiability,
    plateGlass
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
   * TOTAL SUM INSURED
   * =========================================================
   */

  const totalSumInsured =
    Number(sumInsured.buildingSI || 0) +
    Number(sumInsured.plantAndMachinerySI || 0) +
    Number(sumInsured.stockSI || 0) +
    Number(sumInsured.furnitureFixturesFittingsSI || 0) +
    Number(sumInsured.otherContentsSI || 0);

  console.log(`
=========================================================
TOTAL SUM INSURED
---------------------------------------------------------
${totalSumInsured}
=========================================================
  `);

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
   * FETCH DB RATES
   * =========================================================
   */

  const occupancyData =
    await prisma.occupancyRateMaster.findFirst({
      where: {
        risk_code: riskCode
      }
    });

  const locationData =
    await prisma.locationRateMaster.findFirst({
      where: {
        pincode: pinCode
      }
    });

  if (!occupancyData || !locationData) {
    throw new Error("Invalid risk code or pincode");
  }

  /**
   * =========================================================
   * MASTER RATES
   * =========================================================
   */

  const iibRate =
    Number(occupancyData.iib_rate);

  const stfiRate =
    Number(occupancyData.stfi_rate);

  const terrorismRate =
    Number(occupancyData.terrorism_rate);

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

  let eqRate = 0;

  const occupancyCategory =
    occupancyData.occupancy_category;

  if (occupancyCategory === "Dwelling") {

    eqRate =
      Number(locationData.dwelling_rate);

  } else if (
    occupancyCategory === "Non - Industrial"
  ) {

    eqRate =
      Number(locationData.non_industrial_rate);

  } else if (
    occupancyCategory === "Industrial"
  ) {

    eqRate =
      Number(locationData.industrial_rate);
  }

  console.log(`
=========================================================
EARTHQUAKE RATE
---------------------------------------------------------
OCCUPANCY CATEGORY : ${occupancyCategory}
EQ RATE            : ${eqRate}
=========================================================
  `);

  /**
   * =========================================================
   * FIRE RATE CALCULATION
   * =========================================================
   */

  const net_rate_iib =
    iibRate -
    (
      iibRate *
      iibDiscountPercent / 100
    );

  const net_cat_rate =
    (eqRate + stfiRate) -
    (
      (eqRate + stfiRate) *
      natcatDiscountPercent / 100
    );

  const final_rate =
    net_rate_iib +
    net_cat_rate;

  const terrorismApplied =
    terrorism ? terrorismRate : 0;

  const fireRate =
    final_rate +
    terrorismApplied;

  console.log(`
=========================================================
FIRE RATE BREAKUP
---------------------------------------------------------
NET IIB RATE        : ${round2(net_rate_iib)}
NET CAT RATE        : ${round2(net_cat_rate)}
FINAL RATE          : ${round2(final_rate)}
TERRORISM APPLIED   : ${terrorismApplied}
TOTAL FIRE RATE     : ${round2(fireRate)}
=========================================================
  `);

  /**
   * =========================================================
   * FIRE PREMIUM
   * =========================================================
   */

  const firePremium =
    round2(
      (totalSumInsured * fireRate) / 1000
    );

  logSection({
    section: "FIRE & ALLIED PERILS",
    sumInsured: totalSumInsured,
    rate: round2(fireRate),
    basis: 1000,
    premium: firePremium
  });

  /**
   * =========================================================
   * BURGLARY PREMIUM
   * =========================================================
   */

  let burglaryPremium = 0;
  let burglarySI = 0;

  if (burglary) {

    burglarySI =
      Number(sections.section2?.plantAndMachinerySI || 0) +
      Number(sections.section2?.stockSI || 0) +
      Number(sections.section2?.furnitureFixturesFittingsSI || 0) +
      Number(sections.section2?.otherContentsSI || 0);

    burglaryPremium =
      round2(
        (
          burglarySI *
          SECTION_RATES.burglary.rate
        ) /
        SECTION_RATES.burglary.basis
      );
  }

  logSection({
    section: "BURGLARY & RSMD",
    sumInsured: burglarySI,
    rate: SECTION_RATES.burglary.rate,
    basis: SECTION_RATES.burglary.basis,
    premium: burglaryPremium
  });

  /**
   * =========================================================
   * MACHINERY BREAKDOWN
   * =========================================================
   */

  let machineryBreakdownPremium = 0;

  if (
    machineryBreakdown &&
    sections.section3A?.machineryBreakdownSI
  ) {

    machineryBreakdownPremium =
      round2(
        (
          sections.section3A.machineryBreakdownSI *
          SECTION_RATES.machinery_breakdown.rate
        ) /
        SECTION_RATES.machinery_breakdown.basis
      );
  }

  logSection({
    section: "MACHINERY BREAKDOWN",
    sumInsured:
      sections.section3A?.machineryBreakdownSI || 0,
    rate:
      SECTION_RATES.machinery_breakdown.rate,
    basis:
      SECTION_RATES.machinery_breakdown.basis,
    premium: machineryBreakdownPremium
  });

  /**
   * =========================================================
   * BOILER PRESSURE PLANT
   * =========================================================
   */

  let boilerPressurePlantPremium = 0;

  if (boilerPressurePlant) {

    const boilerSI =
      Number(
        sections.section3B?.boilerPressurePlantSI || 0
      );

    boilerPressurePlantPremium =
      round2(
        (
          boilerSI *
          SECTION_RATES.boiler_pressure_plant.rate
        ) /
        SECTION_RATES.boiler_pressure_plant.basis
      );
  }

  logSection({
    section: "BOILER PRESSURE PLANT",
    sumInsured:
      sections.section3B?.boilerPressurePlantSI || 0,
    rate:
      SECTION_RATES.boiler_pressure_plant.rate,
    basis:
      SECTION_RATES.boiler_pressure_plant.basis,
    premium: boilerPressurePlantPremium
  });

  /**
   * =========================================================
   * ELECTRONIC EQUIPMENT
   * =========================================================
   */

  let electronicEquipmentPremium = 0;

  if (electronicEquipment) {

    const equipmentSI =
      Number(
        sections.section4?.electronicEquipmentSI || 0
      );

    electronicEquipmentPremium =
      round2(
        (
          equipmentSI *
          SECTION_RATES.electronic_equipment_insurance.rate
        ) /
        SECTION_RATES.electronic_equipment_insurance.basis
      );
  }

  logSection({
    section: "ELECTRONIC EQUIPMENT",
    sumInsured:
      sections.section4?.electronicEquipmentSI || 0,
    rate:
      SECTION_RATES.electronic_equipment_insurance.rate,
    basis:
      SECTION_RATES.electronic_equipment_insurance.basis,
    premium: electronicEquipmentPremium
  });

  /**
   * =========================================================
   * PORTABLE EQUIPMENT
   * =========================================================
   */

  let portableEquipmentPremium = 0;

  if (portableEquipment) {

    const portableSI =
      Number(
        sections.section5?.portableEquipmentSI || 0
      );

    portableEquipmentPremium =
      round2(
        (
          portableSI *
          SECTION_RATES.portable_equipments_insurance.rate
        ) /
        SECTION_RATES.portable_equipments_insurance.basis
      );
  }

  logSection({
    section: "PORTABLE EQUIPMENT",
    sumInsured:
      sections.section5?.portableEquipmentSI || 0,
    rate:
      SECTION_RATES.portable_equipments_insurance.rate,
    basis:
      SECTION_RATES.portable_equipments_insurance.basis,
    premium: portableEquipmentPremium
  });

  /**
   * =========================================================
   * MONEY INSURANCE
   * =========================================================
   */

  let moneyInsurancePremium = 0;

  const moneySI =
    Number(sections.section6?.moneyInTransitSI || 0) +
    Number(sections.section6?.moneyInCounterSI || 0) +
    Number(sections.section6?.moneyInSafeSI || 0);

  if (moneyInsurance) {

    moneyInsurancePremium =
      round2(
        (
          moneySI *
          SECTION_RATES.money_insurance.rate
        ) /
        SECTION_RATES.money_insurance.basis
      );
  }

  logSection({
    section: "MONEY INSURANCE",
    sumInsured: moneySI,
    rate:
      SECTION_RATES.money_insurance.rate,
    basis:
      SECTION_RATES.money_insurance.basis,
    premium: moneyInsurancePremium
  });

  /**
   * =========================================================
   * FIDELITY GUARANTEE
   * =========================================================
   */

  let fidelityGuaranteePremium = 0;

  const employeeCount =
    Number(sections.section7?.numberOfEmployees || 0);

  const perEmployeeSI =
    Number(sections.section7?.perEmployeeSI || 0);

  const fidelitySI =
    employeeCount * perEmployeeSI;

  if (fidelityGuarantee) {

    fidelityGuaranteePremium =
      round2(
        (
          fidelitySI *
          SECTION_RATES.fidelity_guarantee_insurance.rate
        ) /
        SECTION_RATES.fidelity_guarantee_insurance.basis
      );
  }

  logSection({
    section: "FIDELITY GUARANTEE",
    sumInsured: fidelitySI,
    rate:
      SECTION_RATES.fidelity_guarantee_insurance.rate,
    basis:
      SECTION_RATES.fidelity_guarantee_insurance.basis,
    premium: fidelityGuaranteePremium
  });

  /**
   * =========================================================
   * PERSONAL ACCIDENT
   * =========================================================
   */

  let personalAccidentPremium = 0;

  const totalPASI =
    Number(sections.section8?.tableA_DeathBenefitOnlySI || 0) +
    Number(sections.section8?.tableB_DeathPlusPTDSI || 0) +
    Number(sections.section8?.tableC_DeathPTDPPDSI || 0) +
    Number(sections.section8?.tableD_DeathPTDPPDTTDSI || 0);

  if (personalAccident) {

    personalAccidentPremium =
      round2(
        (
          totalPASI *
          SECTION_RATES.personal_accident_insurance.rate
        ) /
        SECTION_RATES.personal_accident_insurance.basis
      );
  }

  logSection({
    section: "PERSONAL ACCIDENT",
    sumInsured: totalPASI,
    rate:
      SECTION_RATES.personal_accident_insurance.rate,
    basis:
      SECTION_RATES.personal_accident_insurance.basis,
    premium: personalAccidentPremium
  });

  /**
   * =========================================================
   * BUSINESS INTERRUPTION
   * =========================================================
   */

  let businessInterruptionPremium = 0;

  const businessInterruptionSI =
    Number(
      sections.section9?.businessInterruptionSI || 0
    );

  if (businessInterruption) {

    businessInterruptionPremium =
      round2(
        (
          businessInterruptionSI *
          SECTION_RATES.business_interruption.rate
        ) /
        SECTION_RATES.business_interruption.basis
      );
  }

  logSection({
    section: "BUSINESS INTERRUPTION",
    sumInsured: businessInterruptionSI,
    rate:
      SECTION_RATES.business_interruption.rate,
    basis:
      SECTION_RATES.business_interruption.basis,
    premium: businessInterruptionPremium
  });

  /**
   * =========================================================
   * PUBLIC LIABILITY
   * =========================================================
   */

  let publicLiabilityPremium = 0;

  if (
    publicLiability &&
    sections.section10?.publicLiabilitySI
  ) {

    publicLiabilityPremium =
      round2(
        (
          sections.section10.publicLiabilitySI *
          SECTION_RATES.public_liability_insurance.rate
        ) /
        SECTION_RATES.public_liability_insurance.basis
      );
  }

  logSection({
    section: "PUBLIC LIABILITY",
    sumInsured:
      sections.section10?.publicLiabilitySI || 0,
    rate:
      SECTION_RATES.public_liability_insurance.rate,
    basis:
      SECTION_RATES.public_liability_insurance.basis,
    premium: publicLiabilityPremium
  });

  /**
   * =========================================================
   * PLATE GLASS
   * =========================================================
   */

  let plateGlassPremium = 0;

  if (
    plateGlass &&
    sections.section11?.plateGlassSI
  ) {

    plateGlassPremium =
      round2(
        (
          sections.section11.plateGlassSI *
          SECTION_RATES.plate_glass.rate
        ) /
        SECTION_RATES.plate_glass.basis
      );
  }

  logSection({
    section: "PLATE GLASS",
    sumInsured:
      sections.section11?.plateGlassSI || 0,
    rate:
      SECTION_RATES.plate_glass.rate,
    basis:
      SECTION_RATES.plate_glass.basis,
    premium: plateGlassPremium
  });

  /**
   * =========================================================
   * NET PREMIUM
   * =========================================================
   */

  const net_premium =
    round2(
      firePremium +
      burglaryPremium +
      machineryBreakdownPremium +
      boilerPressurePlantPremium +
      electronicEquipmentPremium +
      portableEquipmentPremium +
      moneyInsurancePremium +
      fidelityGuaranteePremium +
      personalAccidentPremium +
      businessInterruptionPremium +
      publicLiabilityPremium +
      plateGlassPremium
    );

  /**
   * =========================================================
   * GST
   * =========================================================
   */

  const gst =
    round2(
      net_premium * 0.18
    );

  /**
   * =========================================================
   * GROSS PREMIUM
   * =========================================================
   */

  const gross_premium =
    round2(
      net_premium + gst
    );

  console.log(`
=========================================================
FINAL PREMIUM SUMMARY
---------------------------------------------------------
NET PREMIUM   : ${net_premium}
GST @18%      : ${gst}
GROSS PREMIUM : ${gross_premium}
=========================================================
  `);

  /**
   * =========================================================
   * RESPONSE
   * =========================================================
   */

  return {

    customerDetails: {
      customerName,
      address,
      pinCode,
      riskCode,
      occupancy,
      description
    },

    totalSumInsured,

    rates: {
      iibRate,
      stfiRate,
      terrorismRate,
      eqRate,
      fireRate: round2(fireRate)
    },

    sectionWisePremiums: {

      firePremium,

      burglaryPremium,

      machineryBreakdownPremium,

      boilerPressurePlantPremium,

      electronicEquipmentPremium,

      portableEquipmentPremium,

      moneyInsurancePremium,

      fidelityGuaranteePremium,

      personalAccidentPremium,

      businessInterruptionPremium,

      publicLiabilityPremium,

      plateGlassPremium
    },

    premiumSummary: {
      netPremium: net_premium,
      gst,
      grossPremium: gross_premium
    }
  };
};