import debug from "debug";
import { writeFileSync } from "fs";
import ProgressBar from "progress";

import { Letter, toL } from "./letter";
import { words as wordList } from "./words";

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const RIGHT_POS_RANK = 0.3;

const log_verbose = debug("letters:verbose");
const log_rank = debug("letters:rank");
const log_avail = debug("letters:avail");
const log = debug("words");

const letterList: Letter[] = [];
let sortedLetters: string[] = [];
let bestLetters: string[] = [];

const positions: Record<string, number[]> = {};
const correctPosition: Record<string, number> = {};
const occurrences: Record<string, number> = {};
const letterRank: Record<string, number> = {};
const wordRanks: Record<string, number> = {};

let totalLetters = 0;

for (const letter of ALL_LETTERS) {
  positions[letter] = [0, 0, 0, 0, 0];
  correctPosition[letter] = 0;
  letterRank[letter] = 0;
  occurrences[letter] = 0;
}

function Add(word: string) {
  const ltrs = toL(word);

  // For stats, use all words
  for (const [i, letter] of toL(word).entries()) {
    positions[letter][i]++;
    occurrences[letter]++;
    totalLetters++;
  }

  // Don't bother words with duplicate letters
  if (ltrs.length < 5) return;

  for (const letter of ltrs) {
    let ltr = letterList.find((l) => l.letter === letter);
    if (!ltr) {
      ltr = new Letter(letter, word);
      letterList.push(ltr);
    }
    ltr.newWord(word);
  }
}

function DetailRank(word: string, offset: number): { rank: number; detail: any } {
  const detail: any = {};
  const letters = toL(word);
  let posHits = 0;
  let rank = 0;
  for (const [pos, letter] of letters.entries()) {
    detail[`W${offset}L${pos}-Rank`] = letterRank[letter];
    rank += letterRank[letter];
    if (pos === correctPosition[letter]) {
      rank += RIGHT_POS_RANK;
      detail[`W${offset}L${pos}-Pos`] = RIGHT_POS_RANK;
      posHits++;
    } else {
      detail[`W${offset}L${pos}-Pos`] = 0;
    }
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
  for (const word of Object.keys(wordList)) {
    Add(word);
  }
  for (const letter of ALL_LETTERS) {
    letterRank[letter] = occurrences[letter] / totalLetters;
  }

  letterList.sort((a, b) => b.words.length - a.words.length);
  sortedLetters = letterList.map((l) => l.letter);
  log_verbose(`${letterList.length} sorted`);

  bestLetters = sortedLetters.slice(0, 15);
  bestLetters.forEach(
    (letter) => (correctPosition[letter] = positions[letter].indexOf([...positions[letter]].sort((a, b) => b - a)[0])),
  );

  log_verbose(`Best letters: ${bestLetters.join(",")}`);
  log_verbose(bestLetters.map((letter, i) => `* ${letter} - ${i + 1}, pos: ${correctPosition[letter] + 1}`).join("\n"));
}

export function Available(letters: string[] = []): string[] {
  const in_common = (a: string | string[], b: string | string[]): number => toL(a).filter((x) => toL(b).includes(x)).length;

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

  const keyToRank = (words: string[]): number => Rank(words[0]) + Rank(words[1]) + Rank(words[2]);

  const word1entries = [...Available(bestLetters.slice(8)).entries()];

  const bar = new ProgressBar(":percent complete [:bar] :show :etas (:total total)", { total: word1entries.length });

  for (const [_, word1] of word1entries) {
    const word2entries = [...Available(toL(word1)).entries()];
    for (const [i2, word2] of word2entries) {
      for (const word3 of [...Available(toL(word1 + word2))]) {
        const words = [word1, word2, word3].sort((a, b) => Rank(b) - Rank(a));
        const key = words.join(",");

        const { rank: word1rank, detail: detail1 } = DetailRank(word1, 1);
        const { rank: word2rank, detail: detail2 } = DetailRank(word2, 2);
        const { rank: word3rank, detail: detail3 } = DetailRank(word3, 3);
        const detail = {
          word1,
          word1rank,
          ...detail1,
          word2,
          word2rank,
          ...detail2,
          word3,
          word3rank,
          ...detail3,
          combRank: word1rank + word2rank + word3rank,
          posHits: detail1["W1-posHits"] + detail2["W2-posHits"] + detail3["W3-posHits"],
        };
        details.push(detail);
        if (keys.includes(key)) continue;
        const result: Results = {
          words,
          rank: detail.combRank,
          posHits: detail.posHits,
          output: `${key}: rank=${detail.combRank.toFixed(1)}, posHits=${detail.posHits}`,
        };
        let found = false;
        const myRank = keyToRank(words);
        for (let [i, existing] of results.entries()) {
          if (myRank > existing.rank) {
            results.splice(i, 0, result);
            found = true;
            break;
          }
        }
        if (!found) results.push(result);
        bar.tick(0, {
          total: results.length,
          show: `${i2}/${word2entries.length} 2nd`,
        });
        writeFileSync("./all.json", JSON.stringify(results.map((r) => r.output).slice(0, 10), null, 4));
        writeFileSync("./details.json", JSON.stringify(details, null, 4));
      }
    }
    bar.tick();
  }
  return results.map((r) => r.output).slice(0, 10);
}
