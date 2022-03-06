import debug from "debug";
import { writeFileSync } from "fs";
import ProgressBar from "progress";

import { Letter, toL as toLetterAry } from "./letter";
import { words as masterWordList } from "./words";

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

const log_verbose = debug("letters:verbose");
const log_rank = debug("letters:rank");
const log_avail = debug("letters:avail");
const log = debug("words");

const letterMap: Record<string, Letter> = {};
ALL_LETTERS.forEach((letter) => {
  letterMap[letter] = new Letter(letter);
});
const letterList: Letter[] = Object.values(letterMap);
const wordList = Object.keys(masterWordList);

let sortedLetters: string[] = [];
let bestLetters: string[] = [];

const wordRanks: Record<string, number> = {};

const totalLetters = wordList.length * 5;

function DetailRank(word: string, offset: number): { rank: number; detail: any } {
  const detail: any = {};
  const letters = toLetterAry(word);
  let posHits = 0;
  let rank = 0;
  for (const [pos, letter] of letters.entries()) {
    detail[`W${offset}L${pos}-Rank`] = letterMap[letter].rank;
    let r = letterMap[letter].rank;
    if (pos === letterMap[letter].bestPosition) {
      detail[`W${offset}L${pos}-Pos`] = r;
      r *= 2;
      posHits++;
    } else {
      detail[`W${offset}L${pos}-Pos`] = 0;
    }
    rank += r;
  }
  detail[`W${offset}-posHits`] = posHits;
  log_rank(`${word} has rank ${rank}`);
  return { rank, detail };
}

function Rank(word: string): number {
  if (wordRanks[word]) return wordRanks[word];
  const { rank } = DetailRank(word, 0);
  wordRanks[word] = rank;
  return rank;
}

export function Process(): void {
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

export function Available(letters: string[] = []): string[] {
  const in_common = (a: string | string[], b: string | string[]): number =>
    toLetterAry(a).filter((x) => toLetterAry(b).includes(x)).length;

  const all = letterList
    .slice(0, 15)
    .reduce((acc: string[], cur) => acc.concat(cur.words.filter((word) => in_common(word, bestLetters) === 5)), [])
    .filter((word) => in_common(letters, word) === 0);
  const res = [...new Set(all)];
  log_avail(`For ${letters.join(",")} we found ${res.length} words`);
  return res;
}

interface Results {
  words: string[];
  rank: number;
  posHits: number;
  output: string;
}

export function buildCombinations(): string[] {
  const keys: string[] = [];
  const results: Results[] = [];
  const details: any[] = [];

  const ranks = [0.6, 0.25, 0.15];

  const word1entries = [...Available().entries()]; // bestLetters.slice(8)

  const bar = new ProgressBar(":percent [:bar] :etas", { total: word1entries.length });

  for (const [i1, word1] of word1entries) {
    const word2entries = [...Available(toLetterAry(word1)).entries()];
    if (i1 === 0) bar.interrupt(`Total Loops: ${word1entries.length}`);
    bar.tick(0);
    for (const [i2, word2] of word2entries) {
      for (const word3 of [...Available(toLetterAry(word1 + word2))]) {
        const words = [word1, word2, word3];
        const key = words.join(",");

        const { rank: word1rank, detail: detail1 } = DetailRank(word1, 1);
        const { rank: word2rank, detail: detail2 } = DetailRank(word2, 2);
        const { rank: word3rank, detail: detail3 } = DetailRank(word3, 3);
        const detail = {
          word1,
          word1rank: word1rank * ranks[0],
          ...detail1,
          word2,
          word2rank: word2rank * ranks[1],
          ...detail2,
          word3,
          word3rank: word3rank * ranks[2],
          ...detail3,
          combRank: word1rank * ranks[0] + word2rank * ranks[1] + word3rank * ranks[2],
          posHits: detail1["W1-posHits"] + detail2["W2-posHits"] + detail3["W3-posHits"],
        };
        details.push(detail);
        if (keys.includes(key)) continue;
        const result: Results = {
          words,
          rank: detail.combRank,
          posHits: detail.posHits,
          output: `${key}: rank=${detail.combRank.toFixed(2)}, ${detail.word1rank.toFixed(2)}/${detail.word2rank.toFixed(
            2,
          )}/${detail.word3rank.toFixed(2)}, posHits=${detail.posHits}`,
        };
        let found = false;
        for (const [i, existing] of results.entries()) {
          if (detail.combRank > existing.rank) {
            results.splice(i, 0, result);
            found = true;
            break;
          }
        }
        if (!found) results.push(result);
        writeFileSync("./all.json", JSON.stringify(results.map((r) => r.output).slice(0, 10), null, 4));
        writeFileSync("./details.json", JSON.stringify(details, null, 4));
      }
    }
    bar.tick();
  }
  return results.map((r) => r.output).slice(0, 10);
}
