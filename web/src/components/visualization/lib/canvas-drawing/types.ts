export interface ViewTransform {
    cx: number;
    cy: number;
    scale: number;
    toScreen(x: number, y: number): [number, number];
}
