/**
 * "Just the picture" hides the drawn layers and remembers them.
 */
import { describe, expect, it } from "vitest";

import { LAYER_DEFAULTS, isJustThePicture, toggleJustThePicture, type Layers } from "./layers";

describe("just the picture", () => {
    it("from the defaults, shows the picture alone and remembers the line and the circles", () => {
        const { layers, hid } = toggleJustThePicture({ ...LAYER_DEFAULTS }, null);
        expect(layers).toEqual({ picture: true, outline: false, line: false, circles: false });
        expect(isJustThePicture(layers)).toBe(true);
        expect(hid).toEqual(["line", "circles"]);
    });

    it("pressed again, brings back exactly what it hid", () => {
        const start: Layers = { picture: false, outline: true, line: false, circles: true };
        const once = toggleJustThePicture(start, null);
        expect(once.layers).toEqual({ picture: true, outline: false, line: false, circles: false });
        const twice = toggleJustThePicture(once.layers, once.hid);
        expect(twice.layers).toEqual({ picture: true, outline: true, line: false, circles: true });
        expect(twice.hid).toBeNull();
    });

    it("on the picture alone with nothing remembered, brings back the defaults' drawn layers", () => {
        const { layers } = toggleJustThePicture({ picture: true, outline: false, line: false, circles: false }, null);
        expect(layers).toEqual({ picture: true, outline: false, line: true, circles: true });
    });

    it("a drawn layer on means it is not the picture alone", () => {
        expect(isJustThePicture({ picture: true, outline: false, line: true, circles: false })).toBe(false);
        expect(isJustThePicture({ picture: false, outline: false, line: false, circles: false })).toBe(false);
    });
});
