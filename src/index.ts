import * as R from 'ramda';

type FeeBreaddown = {
    minCharge: number,
    usageCharge: number,
    adjustmentPrice: number,
    total: number
};

type UnitPriceRecord = {
    min: number,
    max: number,
    price: number
};

type UnitPriceTable = {
    minimumFee: number,
    usageCharge: UnitPriceRecord[],
    baseFuelprice: number,
    baseFuelUnitprice: number,
    maxAverageFuelprice: number
};

// おトクeプラン
const eplanPriceTable: UnitPriceTable = {
    minimumFee: 411.4,
    usageCharge: [
        { min: 11, max: 120, price: 20.37 },
        { min: 120, max: 300, price: 26.99 },
        { min: 300, max: 99999, price: 28.30 },
    ],
    baseFuelprice: 26000,
    baseFuelUnitprice: 0.196,
    maxAverageFuelprice: 9999999
};

// 従量電灯A
const usageAPriceTable: UnitPriceTable = {
    minimumFee: 532.68,
    usageCharge: [
        { min: 11, max: 120, price: 31.40 },
        { min: 120, max: 300, price: 38.02 },
        { min: 300, max: 99999, price: 41.53 },
    ],
    baseFuelprice: 80300,
    baseFuelUnitprice: 0.161,
    maxAverageFuelprice: 120450
};

const amountForBilling = (priceRecord: UnitPriceRecord, powerUsage: number): number => {
    const ltRange = R.lt(R.__, priceRecord.min);
    const inRange = R.both(R.lte(priceRecord.min), R.lt(R.__, priceRecord.max));
    const calc =
        R.cond([
            [ltRange, R.always(0)],
            [inRange, R.always(powerUsage - priceRecord.min)],
            [R.T, R.always(priceRecord.max - priceRecord.min)]
        ]);

    return calc(powerUsage);
};

const price = (priceRecord: UnitPriceRecord, powerUsage: number): number =>
    R.multiply(priceRecord.price, amountForBilling(priceRecord, powerUsage));

const electricityUsageCharge = (powerUsage: number, unitPriceTable: UnitPriceTable): number => {
    const fn = R.curry(price)(R.__, powerUsage);
    const fn2 = R.map(fn);
    const fn3 = R.compose(R.sum, fn2);
    return fn3(unitPriceTable.usageCharge);
}

const fuelCostAdjustmentUnitPrice = (averageFuelprice: number, unitPriceTable: UnitPriceTable): number => {
    const cappedPrice = R.min(averageFuelprice, unitPriceTable.maxAverageFuelprice);
    return (cappedPrice - unitPriceTable.baseFuelprice) / 1000 * unitPriceTable.baseFuelUnitprice;
};

const minCharge = (unitPriceTable: UnitPriceTable): number => unitPriceTable.minimumFee;

const fuelCostAdjustmentPrice = (averageFuelprice: number, unitPriceTable: UnitPriceTable, powerUsage: number): number =>
    fuelCostAdjustmentUnitPrice(averageFuelprice, unitPriceTable) * powerUsage;

const electricityCharges = (unitPriceTable: UnitPriceTable, averageFuelPrice: number, powerUsage: number ): FeeBreaddown => {
    const m = minCharge(unitPriceTable);
    const u = electricityUsageCharge(powerUsage, unitPriceTable);
    const a = fuelCostAdjustmentPrice(averageFuelPrice, unitPriceTable, powerUsage);
    return {
        minCharge: m,
        usageCharge: u,
        adjustmentPrice: a,
        total: m + u + a
    };
};

const avgFuelPrice = 85200;
const powerUsage = 480;

console.log(electricityCharges(eplanPriceTable, avgFuelPrice, powerUsage));
console.log(electricityCharges(usageAPriceTable, avgFuelPrice, powerUsage));