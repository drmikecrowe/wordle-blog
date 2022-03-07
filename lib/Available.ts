import { wordCacheByLetters, bestWords, in_common, log_avail } from "./BuildCombinations";

export function Available(letters: string[] = []): string[] {
  letters.sort();
  const letterKey = letters.join("");
  if (wordCacheByLetters[letterKey]) return wordCacheByLetters[letterKey];

  const all = bestWords.filter((word) => in_common(letters, word) === 0);
  const res = [...new Set(all)];
  wordCacheByLetters[letterKey] = res;

  log_avail(`For ${letters.join(",")} we found ${res.length} words`);
  return res;
}
