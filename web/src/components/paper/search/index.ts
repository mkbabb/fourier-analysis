export { usePaperSearch, type PaperSearchState } from "./usePaperSearch";
export { buildSearchIndex, searchIndex, fuzzyMatch } from "./paperSearchIndex";
export type { SearchEntry, SearchResult } from "./paperSearchIndex";
export { TYPE_LABELS, resultLabel, highlightFuzzy, escapeHtml } from "./searchHelpers";
