/**
 * The package carries vector data only: no raster bytes, no inline image, no
 * photo metadata, in any file it ships or tests with (P4, P5, P6).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function files(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        if (name === "node_modules" || name === "dist" || name.endsWith(".tgz")) return [];
        const p = join(dir, name);
        return statSync(p).isDirectory() ? files(p) : [p];
    });
}

const MAGIC: [string, (b: Buffer) => boolean][] = [
    ["jpeg", (b) => b.includes(Buffer.from([0xff, 0xd8, 0xff]))],
    ["png", (b) => b.includes(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
    ["gif", (b) => b.includes(Buffer.from("GIF89a")) || b.includes(Buffer.from("GIF87a"))],
    ["webp", (b) => /RIFF....WEBP/s.test(b.toString("latin1"))],
    ["heic/avif", (b) => /ftyp(heic|heix|mif1|msf1|avif|avis)/.test(b.toString("latin1"))],
    ["tiff", (b) => b.includes(Buffer.from([0x49, 0x49, 0x2a, 0x00])) || b.includes(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))],
];
const TEXT = [/data:image\//, /\/9j\//, /iVBORw0KGgo/, /Exif\0\0/, /GPSLatitude|GPSLongitude|DateTimeOriginal|iPhone/];

describe("privacy", () => {
    // This file names the patterns it looks for, so it is the one file not scanned.
    const self = fileURLToPath(import.meta.url);
    const all = files(ROOT).filter((f) => f !== self);
    // The scan must reach the test fixtures and the sources, or it proves nothing.
    it("scans what the package holds", () => {
        expect(all.some((f) => f.includes("fixtures"))).toBe(true);
        expect(all.some((f) => f.endsWith("index.ts"))).toBe(true);
    });

    for (const f of all) {
        it(`${f.slice(ROOT.length)} holds no raster or photo metadata`, () => {
            const b = readFileSync(f);
            for (const [kind, has] of MAGIC) expect(has(b), kind).toBe(false);
            const s = b.toString("latin1");
            for (const re of TEXT) expect(re.test(s), String(re)).toBe(false);
        });
    }
});
