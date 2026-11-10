/**
 * Canon F8 (restraint, C-10): the app's one number formatter. A number shows
 * what a reader can use: `sig` significant figures (two by default, the
 * series' own rounding on the server), trailing zeros dropped, and a true
 * minus sign (U+2212), never a hyphen.
 */
export function formatNumber(value: number, sig = 2): string {
    if (!Number.isFinite(value)) return String(value);
    const rounded = Number(value.toPrecision(sig));
    if (rounded === 0) return "0";
    const decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(rounded))));
    const text = rounded.toFixed(decimals).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    return text.replace("-", "−");
}
