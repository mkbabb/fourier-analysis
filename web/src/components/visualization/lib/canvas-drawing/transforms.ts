export function spectrumColor(i: number, total: number): string {
    const t = i / Math.max(total - 1, 1);
    const curved = Math.pow(t, 0.6);
    const hue = (1 - curved) * 300;
    return `hsl(${hue}, 85%, 55%)`;
}
