/**
 * Paper content extracted from fourier_paper.tex.
 * Each section maps to a chapter in the LaTeX source.
 */

export interface PaperSectionData {
    id: string;
    number: string;
    title: string;
    paragraphs: string[];
    theorems?: {
        type: "theorem" | "definition" | "lemma" | "proposition";
        name?: string;
        /** HTML content with <MathInline>/<MathBlock> replaced by tex strings */
        body: string;
        /** Display math equations within the theorem */
        math?: string[];
    }[];
    /** Inline interactive callout */
    callout?: { text: string; link: string };
}

export const paperSections: PaperSectionData[] = [
    {
        id: "introduction",
        number: "1",
        title: "Introduction",
        paragraphs: [
            `The study of Fourier analysis has seen use in a wide array of topics such as spectrum analysis, ordinary and partial differential equation analysis, data compression, and beyond. An assuredly useful field of study, as it allows one to decompose an otherwise complex function into a sum of simple sinusoids of varying period and amplitude.`,
            `This analysis is composed of two primary concepts: Fourier series and the Fourier transform. The former is the notion of decomposing a function $f$ into a sum of sinusoidal waves. Through this process, one discovers the Fourier transform: which describes the amplitude and phase of each sinusoid that $f$ is composed of.`,
            `The central object of study is the Fourier series of a periodic function $f$:`,
        ],
        theorems: [
            {
                type: "theorem",
                name: "Fourier Series",
                body: `A well-behaved function $f(x)$ can be expanded into the following infinite series:`,
                math: [
                    `f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\bigl( a_n \\cos(nx) + b_n \\sin(nx) \\bigr)`,
                    `f(x) = \\sum_{n=-\\infty}^{\\infty} c_n \\, e^{inx}`,
                ],
            },
        ],
    },
    {
        id: "origin",
        number: "2",
        title: "Origin and Derivation",
        paragraphs: [
            `Jean-Baptiste Joseph Fourier (1768–1830) published "Théorie analytique de la chaleur" in 1822, introducing the revolutionary idea that any well-behaved function can be expanded into a series of sinusoidal waves. It is this publication that is indubitably one of his most important: for it introduces the notion that any well-behaved function can be thereby expanded into a series of sinusoids.`,
            `Utilizing excerpts from Fourier's treatise, we derive Fourier series in a manner similar to Fourier himself. The problem begins with a partial differential equation describing the heat flow over an infinite rectangular plate with Dirichlet boundary conditions:`,
        ],
        theorems: [
            {
                type: "definition",
                name: "Fourier's Heat Problem",
                body: `Starting from the general heat equation $u_t = \\Delta u$ where $u = u(x, y, t)$, the steady-state condition $u_t = 0$ yields Laplace's equation:`,
                math: [
                    `\\dfrac{\\partial^2 u}{\\partial x^2} + \\dfrac{\\partial^2 u}{\\partial y^2} = 0`,
                ],
            },
            {
                type: "theorem",
                name: "Eigenfunction Orthogonality",
                body: `If the Sturm-Liouville equation with boundary conditions $y(a) = y(b) = 0$ produces distinct eigenfunction-value pairs $(y_n, \\lambda_n)$ and $(y_m, \\lambda_m)$, then $y_n$ and $y_m$ are orthogonal on $[a, b]$:`,
                math: [
                    `\\int_{a}^{b} y_n y_m w(x) \\, dx = 0, \\quad \\lambda_n \\neq \\lambda_m`,
                ],
            },
        ],
    },
    {
        id: "linear-algebra",
        number: "3",
        title: "Lens I — Linear Algebra",
        paragraphs: [
            `Functions can be viewed as infinite-dimensional vectors in the Hilbert space $\\mathbf{L}^2[a,b]$. Just as a finite-dimensional vector can be decomposed in an orthonormal basis $\\{\\hat{e}_n\\}$, so too can a function be decomposed in a basis of orthogonal functions.`,
            `A finite-dimensional vector $\\vec{u}$ admits the decomposition $\\vec{u} = \\sum_{n=0}^{N} c_n \\hat{e}_n$ where $c_n = \\langle \\vec{u}, \\hat{e}_n \\rangle$. The Fourier series is precisely this decomposition in the Hilbert space of square-integrable functions, with the orthonormal basis $\\{e^{inx}\\}$.`,
        ],
        theorems: [
            {
                type: "definition",
                name: "Hilbert Space $\\mathbf{L}^2[a,b]$",
                body: `The space of square-integrable functions on $[a,b]$ with inner product and norm:`,
                math: [
                    `\\langle f, g \\rangle = \\int_a^b f(x)\\overline{g(x)} \\, dx, \\qquad \\|f\\| = \\sqrt{\\langle f, f \\rangle}`,
                ],
            },
            {
                type: "theorem",
                name: "Cauchy–Schwarz Inequality",
                body: `For any $f, g$ in an inner product space:`,
                math: [
                    `|\\langle f, g \\rangle| \\leq \\|f\\| \\cdot \\|g\\|`,
                ],
            },
        ],
    },
    {
        id: "complex-analysis",
        number: "4",
        title: "Lens II — Complex Analysis",
        paragraphs: [
            `Complex analysis provides another perspective on Fourier series through Laurent series and analytic functions. If $f$ is holomorphic on an annulus $A = \\{z: r_1 < |z - z_0| < r_2\\}$, then $f$ admits a Laurent expansion.`,
            `The crucial connection: on the unit circle $z = e^{i\\theta}$, the Laurent series restricts to the complex Fourier series. Laurent coefficients become Fourier coefficients, and completeness of the Fourier series follows from completeness of the Laurent series on the annulus.`,
        ],
        theorems: [
            {
                type: "theorem",
                name: "Laurent Series",
                body: `If $f$ is holomorphic on the annulus $\\{z: r_1 < |z - z_0| < r_2\\}$, then:`,
                math: [
                    `f(z) = \\sum_{n=-\\infty}^{\\infty} c_n(z - z_0)^n, \\quad c_n = \\frac{1}{2\\pi i}\\oint_{\\gamma} \\frac{f(\\zeta)}{(\\zeta - z_0)^{n+1}} \\, d\\zeta`,
                ],
            },
            {
                type: "definition",
                name: "Cauchy–Riemann Equations",
                body: `For $f(z) = u(x,y) + iv(x,y)$, $f$ is holomorphic iff:`,
                math: [
                    `\\frac{\\partial u}{\\partial x} = \\frac{\\partial v}{\\partial y}, \\qquad \\frac{\\partial u}{\\partial y} = -\\frac{\\partial v}{\\partial x}`,
                ],
            },
        ],
    },
    {
        id: "dft",
        number: "5",
        title: "The Discrete Fourier Transform",
        paragraphs: [
            `Moving from continuous to discrete finite data, the Discrete Fourier Transform (DFT) is not merely an approximation but a rich algebraic object with matrix structure. Given $N$ samples $f_0, f_1, \\ldots, f_{N-1}$:`,
        ],
        theorems: [
            {
                type: "definition",
                name: "Discrete Fourier Transform",
                body: `The DFT of a length-$N$ sequence is:`,
                math: [
                    `F_k = \\sum_{n=0}^{N-1} f_n \\, e^{-2\\pi i \\, kn / N}, \\quad k = 0, 1, \\ldots, N-1`,
                ],
            },
            {
                type: "theorem",
                name: "Cooley–Tukey FFT",
                body: `The Fast Fourier Transform computes the DFT in $O(N \\log N)$ operations via radix-2 decomposition. For $N = 2M$:`,
                math: [
                    `X_k = E_k + \\omega_N^k O_k, \\qquad X_{k+M} = E_k - \\omega_N^k O_k`,
                ],
            },
            {
                type: "theorem",
                name: "Circulant Diagonalization",
                body: `Every circulant matrix $C$ is diagonalized by the DFT matrix:`,
                math: [
                    `C = F_N^{-1} \\Lambda F_N, \\quad \\Lambda = \\operatorname{diag}(F_N c)`,
                ],
            },
        ],
    },
    {
        id: "applications",
        number: "6",
        title: "Applications",
        paragraphs: [
            `The contour extraction pipeline transforms a raster image into a Fourier-representable path: grayscale conversion, Gaussian blur, multi-Otsu thresholding, marching squares contour extraction, tour optimization via 2-opt, and arc-length resampling.`,
            `With the resampled contour in hand, we compute the FFT to obtain Fourier coefficients, construct an epicycle chain, and animate the reconstruction. Each term $c_n e^{2\\pi int}$ is a rotating vector whose tip traces a circle of radius $|c_n|$ at angular velocity $n$. Chaining these vectors tip-to-tail produces an epicycle machine whose tip traces the original curve.`,
        ],
        theorems: [
            {
                type: "theorem",
                name: "Convolution Theorem",
                body: `For $f, g \\in \\mathbf{L}^1(\\mathbb{R})$:`,
                math: [
                    `\\widehat{f * g}(k) = \\hat{f}(k) \\cdot \\hat{g}(k)`,
                ],
            },
            {
                type: "theorem",
                name: "Parseval's Identity",
                body: `Total power is conserved between time and frequency domains:`,
                math: [
                    `\\sum_{n=-\\infty}^{\\infty} |c_n|^2 = \\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi} |f(x)|^2 \\, dx`,
                ],
            },
        ],
        callout: {
            text: "Upload an image and watch epicycles trace its contour",
            link: "/visualize",
        },
    },
];
