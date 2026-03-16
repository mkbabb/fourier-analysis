export type NotationMode = "trig" | "exponential" | "polar";
export type EquationTier = "symbolic" | "identified" | "spline";

export interface FourierTermDTO {
    n: number;
    coefficient_re: number;
    coefficient_im: number;
    amplitude: number;
    phase: number;
}

export interface ComputeEquationRequest {
    expression: string;
    domain_start: number;
    domain_end: number;
    n_harmonics: number;
    n_eval_points: number;
    notation: NotationMode;
    budget: number;
}

export type EquationDisplayMode = "expanded" | "sigma";

export interface ComputeEquationResponse {
    status: string;
    tier: EquationTier;
    latex: string;
    latex_sigma: string;
    coefficients: FourierTermDTO[];
    original_points: { x: number[]; y: number[] };
    reconstructed_points: { x: number[]; y: number[] };
    energy_captured: number;
    effective_n: number;
}

export interface SimplifyRequest {
    coefficients: FourierTermDTO[];
    budget: number;
    notation: NotationMode;
}

export interface SimplifyResponse {
    latex: string;
    energy_captured: number;
    term_count: number;
}

export interface PresetFunction {
    name: string;
    expression: string;
    domain: [number, number];
    description: string;
}
