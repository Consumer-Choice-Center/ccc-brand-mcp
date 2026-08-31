import dictionaryAmericanEnglish from "dictionary-en";
import dictionaryBritishEnglish from "dictionary-en-gb";
import nspell from "nspell";

export type SpellingCorrection = {
  field: string;
  original: string;
  corrected: string;
  start: number;
  end: number;
};

export type SpellingReview = {
  ok: boolean;
  hasCorrections: boolean;
  language: "English (US + UK)";
  userNotice: string;
  highlightedCorrections: string[];
  corrections: SpellingCorrection[];
  originalFields: Record<string, string>;
  correctedFields: Record<string, string>;
};

const american = nspell(
  Buffer.from(dictionaryAmericanEnglish.aff),
  Buffer.from(dictionaryAmericanEnglish.dic),
);
const british = nspell(
  Buffer.from(dictionaryBritishEnglish.aff),
  Buffer.from(dictionaryBritishEnglish.dic),
);

const builtInTerms = [
  "CCC",
  "MCP",
  "LLM",
  "SVG",
  "SVGs",
  "PostScript",
  "Illustrator",
  "onepager",
  "onepagers",
  "ecommerce",
  "fintech",
  "policymaker",
  "policymakers",
  "lawmaker",
  "lawmakers",
  "tariffed",
  "photomontage",
  "cutaway",
  "cutaways",
  "microplastics",
  "geoblocking",
  "deplatforming",
  "ridesharing",
  "homesharing",
  "healthtech",
  "medtech",
  "agtech",
  "crypto",
  "cryptocurrency",
  "vaping",
  "nicotine",
  "cannabis",
  "Bitcoin",
  "Ethereum",
  "CBDC",
  "GDPR",
  "DSA",
  "DMA",
  "NATO",
  "WHO",
  "WTO",
  "OECD",
  "TikTok",
  "Uber",
  "Airbnb",
  "ChatGPT",
  "OpenAI",
  "Google",
  "YouTube",
  "Facebook",
  "Meta",
  "Tesla",
  "Spotify",
  "Amazon",
  "PayPal",
  "Montserrat",
  "Anton",
  "Leila",
  "Hunspell",
  "nspell",
];

const knownCorrections = new Map<string, string>([
  ["acommodation", "accommodation"],
  ["accomodation", "accommodation"],
  ["adress", "address"],
  ["alot", "a lot"],
  ["arguement", "argument"],
  ["beleive", "believe"],
  ["calender", "calendar"],
  ["choiec", "choice"],
  ["collegue", "colleague"],
  ["consuemr", "consumer"],
  ["consuemrs", "consumers"],
  ["definately", "definitely"],
  ["doens", "does"],
  ["doens't", "doesn't"],
  ["enviroment", "environment"],
  ["goverment", "government"],
  ["governement", "government"],
  ["guidlines", "guidelines"],
  ["inconsistant", "inconsistent"],
  ["occured", "occurred"],
  ["perserve", "preserve"],
  ["recieve", "receive"],
  ["relevent", "relevant"],
  ["seperate", "separate"],
  ["similiar", "similar"],
  ["tamplate", "template"],
  ["teh", "the"],
  ["wich", "which"],
]);

for (const term of builtInTerms) {
  american.add(term);
  british.add(term);
}

function damerauLevenshtein(left: string, right: string) {
  const a = [...left.toLocaleLowerCase()];
  const b = [...right.toLocaleLowerCase()];
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let row = 0; row <= a.length; row += 1) matrix[row][0] = row;
  for (let column = 0; column <= b.length; column += 1) matrix[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const substitution = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitution,
      );
      if (
        row > 1
        && column > 1
        && a[row - 1] === b[column - 2]
        && a[row - 2] === b[column - 1]
      ) {
        matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + 1);
      }
    }
  }
  return matrix[a.length][b.length];
}

function applyOriginalCase(original: string, replacement: string) {
  if (original === original.toLocaleUpperCase()) return replacement.toLocaleUpperCase();
  if (original === original.toLocaleLowerCase()) return replacement.toLocaleLowerCase();
  if (/^\p{Lu}[\p{Ll}'’ -]+$/u.test(original)) {
    return replacement.charAt(0).toLocaleUpperCase() + replacement.slice(1).toLocaleLowerCase();
  }
  return replacement;
}

function ignoredRanges(value: string) {
  const ranges: Array<[number, number]> = [];
  const patterns = [
    /\b(?:https?:\/\/|www\.)[^\s<>()]+/giu,
    /\b[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}\b/giu,
    /\b(?:[A-Za-z]:[\\/]|\/)[^\s]+/g,
  ];
  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isIgnored(index: number, ranges: Array<[number, number]>) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function candidateFor(token: string) {
  const lookup = token.replaceAll("’", "'").toLocaleLowerCase();
  const known = knownCorrections.get(lookup);
  if (known) return known;
  if (american.correct(lookup) || british.correct(lookup)) return undefined;
  if (token !== token.toLocaleLowerCase()) return undefined;

  const suggestions = [...new Set([...american.suggest(lookup), ...british.suggest(lookup)])];
  const candidate = suggestions[0];
  if (!candidate || candidate.includes(" ")) return undefined;
  const threshold = Math.min(2, Math.max(1, Math.round([...lookup].length * 0.25)));
  return damerauLevenshtein(lookup, candidate) <= threshold ? candidate : undefined;
}

function correctField(field: string, value: string, protectedTerms: Set<string>) {
  const corrections: SpellingCorrection[] = [];
  const ranges = ignoredRanges(value);
  const tokenPattern = /[\p{L}]+(?:['’][\p{L}]+)*/gu;
  for (const match of value.matchAll(tokenPattern)) {
    const original = match[0];
    const start = match.index;
    if (isIgnored(start, ranges) || original.length < 2 || protectedTerms.has(original.toLocaleLowerCase())) continue;
    const replacement = candidateFor(original);
    if (!replacement || replacement.toLocaleLowerCase() === original.toLocaleLowerCase().replaceAll("’", "'")) continue;
    corrections.push({
      field,
      original,
      corrected: applyOriginalCase(original, replacement),
      start,
      end: start + original.length,
    });
  }

  let corrected = value;
  for (const correction of [...corrections].reverse()) {
    corrected = corrected.slice(0, correction.start) + correction.corrected + corrected.slice(correction.end);
  }
  return { corrected, corrections };
}

export function reviewSpelling(
  fields: Record<string, string | undefined>,
  options: { extraTerms?: string[] } = {},
): SpellingReview {
  const originalFields = Object.fromEntries(
    Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const protectedTerms = new Set(
    [...builtInTerms, ...(options.extraTerms ?? [])]
      .flatMap((term) => term.match(/[\p{L}]+(?:['’][\p{L}]+)*/gu) ?? [])
      .map((term) => term.toLocaleLowerCase()),
  );
  const correctedFields: Record<string, string> = {};
  const corrections: SpellingCorrection[] = [];
  for (const [field, value] of Object.entries(originalFields)) {
    const result = correctField(field, value, protectedTerms);
    correctedFields[field] = result.corrected;
    corrections.push(...result.corrections);
  }
  const highlightedCorrections = corrections.map(
    (correction) => `${correction.field}: ~~${correction.original}~~ → **${correction.corrected}**`,
  );
  return {
    ok: corrections.length === 0,
    hasCorrections: corrections.length > 0,
    language: "English (US + UK)",
    userNotice: corrections.length
      ? `Spelling corrected before generation: ${corrections.map((correction) => `“${correction.original}” → “${correction.corrected}”`).join("; ")}.`
      : "No spelling errors detected.",
    highlightedCorrections,
    corrections,
    originalFields,
    correctedFields,
  };
}
