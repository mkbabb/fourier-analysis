const TERM_STYLES = [
    { term: "Chebyshev", tone: "chebyshev" },
    { term: "Chebshev", tone: "chebyshev" },
    { term: "Legendre", tone: "legendre" },
    { term: "Fourier", tone: "fourier" },
] as const;

function isAsciiLetter(char: string | undefined): boolean {
    if (!char) return false;
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function matchStyledTerm(source: string, offset: number) {
    for (const candidate of TERM_STYLES) {
        const slice = source.slice(offset, offset + candidate.term.length);
        if (slice !== candidate.term) continue;

        const prev = source[offset - 1];
        const next = source[offset + candidate.term.length];
        if (isAsciiLetter(prev) || isAsciiLetter(next)) continue;

        return candidate;
    }

    return null;
}

function enhancePlainText(text: string): string {
    let output = "";
    let cursor = 0;

    while (cursor < text.length) {
        const matched = matchStyledTerm(text, cursor);
        if (!matched) {
            output += text[cursor];
            cursor += 1;
            continue;
        }

        output += `<span class="paper-basis-term paper-basis-term--${matched.tone}">${matched.term}</span>`;
        cursor += matched.term.length;
    }

    return output;
}

export function enhancePaperText(html: string): string {
    let output = "";
    let cursor = 0;

    while (cursor < html.length) {
        if (html[cursor] === "<") {
            const tagEnd = html.indexOf(">", cursor);
            if (tagEnd === -1) {
                output += html.slice(cursor);
                break;
            }
            output += html.slice(cursor, tagEnd + 1);
            cursor = tagEnd + 1;
            continue;
        }

        const nextTag = html.indexOf("<", cursor);
        const textEnd = nextTag === -1 ? html.length : nextTag;
        output += enhancePlainText(html.slice(cursor, textEnd));
        cursor = textEnd;
    }

    return output;
}
