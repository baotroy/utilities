const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 18 });
const units = {
  wei: -18,
  kwei: -15,
  mwei: -12,
  gwei: -9,
  szsabo: -6,
  finney: -3,
  ether: 0,
  kether: 3,
  mether: 6,
  gether: 9,
  tether: 12,
};

const convert = (value, from) => {
  // convert ether to wei
  const bnValue = new BigNumber(value);
  const fromUnit = units[from];

  const result = {};
  for (const unit in units) {
    const toUnit = units[unit];
    result[unit] = bnValue.multipliedBy(BigNumber(10).pow(fromUnit - toUnit)).toString(10);
  }
  return result;
};