import type { PresetFunction } from "./types";

export const PRESETS: PresetFunction[] = [
    {
        name: "Square wave",
        expression: "Piecewise((1, x < pi), (-1, True))",
        domain: [0, 2 * Math.PI],
        description: "Classic square wave with 1/n decay",
    },
    {
        name: "Sawtooth",
        expression: "x",
        domain: [0, 2 * Math.PI],
        description: "Linear ramp — 1/n coefficient pattern",
    },
    {
        name: "Triangle",
        expression: "Piecewise((2*x/pi, x < pi/2), (2 - 2*x/pi, x < 3*pi/2), (2*x/pi - 4, True))",
        domain: [0, 2 * Math.PI],
        description: "Triangle wave — 1/n² decay",
    },
    {
        name: "|sin(x)|",
        expression: "abs(sin(x))",
        domain: [0, 2 * Math.PI],
        description: "Rectified sine — only even harmonics",
    },
    {
        name: "x(π−x)",
        expression: "x*(pi - x)",
        domain: [0, Math.PI],
        description: "Parabolic arch — rapid 1/n² convergence",
    },
    {
        name: "Gaussian",
        expression: "exp(-((x - pi)**2) / 2)",
        domain: [0, 2 * Math.PI],
        description: "Gaussian pulse — exponential decay",
    },
    {
        name: "Step",
        expression: "Heaviside(x - pi, 0.5)",
        domain: [0, 2 * Math.PI],
        description: "Unit step — Gibbs phenomenon",
    },
    {
        name: "x²",
        expression: "x**2",
        domain: [-Math.PI, Math.PI],
        description: "Quadratic — 1/n² cosine series",
    },
];
