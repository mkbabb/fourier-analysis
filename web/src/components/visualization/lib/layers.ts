/**
 * The visualizer's four layers, each switched on its own: the picture under
 * the drawing, the dashed outline of the extraction, the drawn line, and the
 * circles (the epicycle chain, its desktop inset and its legend). The three
 * drawn layers are the ones "just the picture" hides.
 */
export interface Layers {
    picture: boolean;
    outline: boolean;
    line: boolean;
    circles: boolean;
}

export type DrawnLayer = "outline" | "line" | "circles";

export const DRAWN_LAYERS: readonly DrawnLayer[] = ["outline", "line", "circles"];

/** A clean link's layers: the picture, the line and the circles; no dashed outline. */
export const LAYER_DEFAULTS: Readonly<Layers> = Object.freeze({ picture: true, outline: false, line: true, circles: true });

/** The picture and nothing drawn over it. */
export function isJustThePicture(l: Layers): boolean {
    return l.picture && DRAWN_LAYERS.every((k) => !l[k]);
}

/**
 * "Just the picture", pressed. From any view it shows the picture alone and
 * remembers which drawn layers it hid; pressed again on the picture alone it
 * brings those back (the defaults' drawn layers when it remembers none, as
 * after a link that opened on the picture alone).
 */
export function toggleJustThePicture(
    l: Layers,
    hid: readonly DrawnLayer[] | null,
): { layers: Layers; hid: DrawnLayer[] | null } {
    if (isJustThePicture(l)) {
        const back = hid?.length ? hid : DRAWN_LAYERS.filter((k) => LAYER_DEFAULTS[k]);
        const layers = { ...l };
        for (const k of back) layers[k] = true;
        return { layers, hid: null };
    }
    return {
        layers: { picture: true, outline: false, line: false, circles: false },
        hid: DRAWN_LAYERS.filter((k) => l[k]),
    };
}
