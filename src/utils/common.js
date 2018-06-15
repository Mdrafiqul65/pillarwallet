// @flow
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min; // eslint-disable-line
}

export function formatETHAmount(amount: number) {
  return +parseFloat(amount).toFixed(6);
}

export function decodeETHAddress(encodedAddress: string) {
  if (!encodedAddress || encodedAddress.substr(0, 9) !== 'ethereum:') {
    return encodedAddress;
  }
  if (encodedAddress.length >= 51) {
    return encodedAddress.substr(9, 42);
  }
  return encodedAddress;
}

export function pipe(...fns: Function[]) {
  return fns.reduceRight((a, b) => (...args) => a(b(...args)));
}

export function noop() { }

/**
 * formatMoney(n, x, s, c)
 *
 * @param src         Mixed  number to format
 * @param n           Integer length of decimal
 * @param x           Integer length of whole part
 * @param s           Mixed   sections delimiter
 * @param c           Mixed   decimal delimiter
 * @param stripZeros  Boolean set true to strip trailing zeros
 */
export function formatMoney(
  src: number | string,
  n: number = 2,
  x: number = 3,
  s: ?string = ',',
  c: ?string = '.',
  stripZeros: ?boolean = true,
): string {
  const re = `\\d(?=(\\d{${x || 3}})+${n > 0 ? '\\D' : '$'})`;
  let num = Number(src).toFixed(Math.max(0, Math.floor(n)));

  if (stripZeros) {
    num = Number(num).toString();
  }

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), `$&${s || ','}`);
}

export function parseNumber(amount: string = '0') {
  let strg = amount.toString() || '';
  let decimal = '.';
  strg = strg.replace(/[^0-9$.,]/g, '');
  if (strg.indexOf(',') > strg.indexOf('.')) decimal = ',';
  if ((strg.match(new RegExp(`\\${decimal}`, 'g')) || []).length > 1) decimal = '';
  if (decimal !== '' && (strg.length - strg.indexOf(decimal) - 1 === 3)
  && strg.indexOf(`0${decimal}`) !== 0) decimal = '';
  strg = strg.replace(new RegExp(`[^0-9$${decimal}]`, 'g'), '');
  strg = strg.replace(',', '.');
  return parseFloat(strg);
}

export function getCurrencySymbol(currency: string): string {
  const currencies = {
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  return currencies[currency] || '';
}

export function partial(fn: Function, ...fixedArgs: any) {
  return (...rest: any) => {
    return fn.apply(null, [...fixedArgs, ...rest]);
  };
}
