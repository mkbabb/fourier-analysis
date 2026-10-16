// X.F.W12 .a — G-F12-1 ArrowUp probe. Run from web/: node e2e/screenshots/f-w12/arrowup-probe.mjs <run> (dev stack on :3100)
import { chromium } from "@playwright/test";
import path from "node:path";
const BASE = "http://localhost:3100";
const OUT = path.resolve("e2e/screenshots/f-w12");
const run = process.argv[2] ?? "1";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const rows = [];
async function step(loc, name, stepBy) {
    await loc.scrollIntoViewIfNeeded();
    const role = await loc.getAttribute("role");
    await loc.focus();
    const wait = async (v) => page.waitForFunction(([el, x]) => el.value !== x, [await loc.elementHandle(), String(v)], { timeout: 5000 }).catch(() => {});
    // ArrowDown first so a field booted AT its max (High = maxLevel) has room to step up.
    const v0 = Number(await loc.inputValue());
    await loc.press("ArrowDown"); await wait(v0);
    const v1 = Number(await loc.inputValue());
    await loc.press("ArrowUp"); await wait(v1);
    const v2 = Number(await loc.inputValue());
    const ok = v2 - v1 === stepBy && v0 - v1 === stepBy;
    rows.push(`${ok ? "PASS" : "FAIL"} ${name} role=${role} ${v0} -ArrowDown-> ${v1} -ArrowUp-> ${v2} (step ${stepBy})`);
    await loc.locator("xpath=ancestor::*[@data-slot='number-field'][1]/..").screenshot({ path: `${OUT}/run${run}-${name}.png` });
}
await page.goto(`${BASE}/morph`);
await page.getByRole("heading", { name: "Morph", exact: true }).waitFor({ timeout: 60000 });
await page.getByLabel("Low", { exact: true }).first().waitFor({ timeout: 60000 });
await step(page.getByRole("spinbutton", { name: "Low", exact: true }).first(), "hlg-low", 1);
await step(page.getByRole("spinbutton", { name: "High", exact: true }).first(), "hlg-high", 1);
await step(page.getByRole("spinbutton", { name: "Duration" }).first(), "mpc-duration", 10);
await page.goto(`${BASE}/visualize`);
const computes = Promise.all(["epicycles", "bases"].map((k) => page.waitForResponse((r) => r.url().endsWith(`/compute/${k}`) && r.request().method() === "POST", { timeout: 90000 })));
await page.getByTestId("image-file-input").setInputFiles(path.resolve("../assets/portraits/daraksha.jpg"));
await computes;
await step(page.getByRole("spinbutton", { name: "Harmonics" }), "basis-harmonics", 1);
await step(page.getByRole("spinbutton", { name: "Sample Points" }), "basis-points", 128);
console.log(rows.join("\n"));
console.log(`${rows.filter((r) => r.startsWith("PASS")).length}/${rows.length}`);
await b.close();
