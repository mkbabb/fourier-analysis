/** In-place radix-2 FFT; `sign` −1 is the forward transform, +1 the inverse. Unscaled. */
function transform(re: Float64Array, im: Float64Array, sign: 1 | -1): void {
    const n = re.length;
    if (n & (n - 1) || im.length !== n) throw new RangeError(`fft: length ${n} is not a power of two matched by im (${im.length})`);
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            const r = re[i]!;
            re[i] = re[j]!;
            re[j] = r;
            const m = im[i]!;
            im[i] = im[j]!;
            im[j] = m;
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const a = (sign * 2 * Math.PI) / len;
        const wr = Math.cos(a);
        const wi = Math.sin(a);
        const half = len >> 1;
        for (let i = 0; i < n; i += len) {
            let cr = 1;
            let ci = 0;
            for (let j = 0; j < half; j++) {
                const p = i + j;
                const q = p + half;
                const tr = re[q]! * cr - im[q]! * ci;
                const ti = re[q]! * ci + im[q]! * cr;
                re[q] = re[p]! - tr;
                im[q] = im[p]! - ti;
                re[p] = re[p]! + tr;
                im[p] = im[p]! + ti;
                const nr = cr * wr - ci * wi;
                ci = cr * wi + ci * wr;
                cr = nr;
            }
        }
    }
}

/** Forward DFT in place, unscaled: X_k = Σ_j x_j e^{−2πijk/n}. `n` must be a power of two. */
export function fft(re: Float64Array, im: Float64Array): void {
    transform(re, im, -1);
}

/** Inverse DFT in place, unscaled: x_j = Σ_k X_k e^{+2πijk/n}. `n` must be a power of two. */
export function ifft(re: Float64Array, im: Float64Array): void {
    transform(re, im, 1);
}
