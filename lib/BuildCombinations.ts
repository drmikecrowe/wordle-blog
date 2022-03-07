import debug from "debug";
import { writeFileSync } from "fs";
import ProgressBar from "progress";
import { Available } from "./Available";

import { Letter, toL as toLetterAry } from "./letter";
import { words as masterWordList } from "../words";

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

const log_verbose = debug("letters:verbose");
export const log_rank = debug("letters:rank");
export const log_avail = debug("letters:avail");
const log = debug("words");

export const letterMap: Record<string, Letter> = {};
ALL_LETTERS.forEach((letter) => {
  letterMap[letter] = new Letter(letter);
});
export const letterList: Letter[] = Object.values(letterMap);
export const wordList = Object.keys(masterWordList);

export let sortedLetters: string[] = [];
export let bestLetters: string[] = [];
export const bestWords: string[] = [];

export const wordRanks: Record<string, number> = {};
export const wordCacheByLetters: Record<string, string[]> = {};

export const totalLetters = wordList.length * 5;

export function in_common(a: string | string[], b: string | string[]): number {
  return toLetterAry(a).filter((x) => toLetterAry(b).includes(x)).length;
}

export function Prepare(): void {
  wordList.forEach((word) => {
    const letters = toLetterAry(word);

    letters.forEach((letter, i) => {
      // For stats, use all words
      letterMap[letter].bumpPosition(i);

      // Don't bother with words that have duplicate letters
      if (letters.length === 5) letterMap[letter].addWord(word);
    });
  });
  ALL_LETTERS.forEach((letter) => {
    letterMap[letter].rank = letterMap[letter].occurrences / totalLetters;
  });

  letterList.sort((a, b) => b.occurrences - a.occurrences);
  sortedLetters = letterList.map((l) => l.letter);
  bestLetters = sortedLetters.slice(0, 15);

  wordList.forEach((word) => {
    if (in_common(word, bestLetters) === 5) {
      bestWords.push(word);
    }
  });

  log_verbose(`Best letters: ${bestLetters.join(",")}`);
  log_verbose(
    bestLetters
      .map(
        (letter, i) =>
          `${letter} - ${i + 1}: rank=${(100 * letterMap[letter].rank).toFixed(1)}%, pos=${letterMap[letter].bestPosition + 1}`,
      )
      .join("\n"),
  );
}

export function BuildCombinations(): void {
  const word1entries = [...Available().entries()];

  const bar = new ProgressBar(":percent [:bar] :etas", { total: word1entries.length });
  bar.interrupt(`Building Word Combinations: ${word1entries.length}`);

  const lines: string[] = [];

  for (const [i1, word1] of word1entries) {
    const word2entries = [...Available(toLetterAry(word1)).entries()];
    for (const [i2, word2] of word2entries) {
      for (const word3 of [...Available(toLetterAry(word1 + word2))]) {
        const words = [word1, word2, word3];
        lines.push(`[${words.map((word) => `"${word}"`).join(",")}]`);
      }
    }
    bar.tick();
  }
  writeFileSync("bestWordCombinations.json", `[\n  ${lines.join("\n  ,")}\n]`, "utf-8");
}
