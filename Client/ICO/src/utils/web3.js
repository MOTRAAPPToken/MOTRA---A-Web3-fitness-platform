// Web3 utility functions

export const fromWei = (value, decimals = 18) => {
  if (!value) return "0";
  const divisor = BigInt(10 ** decimals);
  const quotient = BigInt(value) / divisor;
  const remainder = BigInt(value) % divisor;
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
};

export const toWei = (value, decimals = 18) => {
  if (!value) return BigInt(0);
  const [integer, fraction = ""] = value.toString().split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integer + paddedFraction);
};

export const formatTokenAmount = (amount, decimals = 18, displayDecimals = 4) => {
  const converted = fromWei(amount, decimals);
  const num = parseFloat(converted);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals
  });
};
