import debug from "debug";
import { writeFileSync } from "fs";
import ProgressBar from "progress";
import { words as wordList } from "./words";

const log_verbose = debug("words:verbose");
const log_rank = debug("words:rank");
const log_avail = debug("words:avail");
const log = debug("words");

const l = (a: string | string[]): string[] => [...new Set(Array.isArray(a) ? a : a.split(""))];
const in_common = (a: string | string[], b: string | string[]): number => l(a).filter((x) => l(b).includes(x)).length;

class Letter {
  letter: string;
  words: string[];
  rank: number;

  static letters: Letter[] = [];
  static sortedLetters: string[] = [];
  static bestLetters: string[] = [];

  constructor(letter: string, word: string) {
    this.letter = letter;
    this.words = [word];
    this.rank = 1;
  }

  newWord(word: string) {
    this.words.push(word);
    this.rank++;
  }

  static Add(letter: string, word: string): Letter {
    let l = Letter.letters.filter((l) => l.letter === letter).shift();
    if (l) {
      l.newWord(word);
    } else {
      l = new Letter(letter, word);
      Letter.letters.push(l);
    }
    return l;
  }

  static Process(): void {
    Letter.letters.sort((a, b) => b.rank - a.rank);
    Letter.sortedLetters = Letter.letters.map((l) => l.letter);
    log_verbose(`${Letter.letters.length} sorted`);
    Letter.bestLetters = Letter.sortedLetters.slice(0, 15);
    log_verbose(`Best letters: ${Letter.bestLetters.join(",")}`);
    log_verbose(Letter.bestLetters.map((letter, i) => `* ${letter} - ${i}`).join("\n"));
  }

  static Rank(word: string): number {
    const letters = l(word);
    let rank = 0 + 50 * (5 - letters.length);
    for (const letter of letters) {
      let i = Letter.bestLetters.indexOf(letter);
      if (i === -1) i = 100;
      log_rank(`${letter}: ${i}`);
      rank += i;
    }
    log_rank(`${word} has rank ${rank}`);
    return rank;
  }

  static Available(letters: string[] = []): string[] {
    const all = Letter.letters
      .slice(0, 15)
      .reduce((acc: string[], cur) => acc.concat(cur.words.filter((word) => in_common(word, Letter.bestLetters) === 5)), [])
      .filter((word) => in_common(letters, word) === 0);
    const res = [...new Set(all)];
    log_avail(`For ${letters.join(",")} we found ${res.length} words`);
    return res;
  }
}

for (const word of Object.keys(wordList)) {
  const letters = l(word);
  if (letters.length < 5) continue; // Don't allow words with duplicate letters
  for (const letter of letters) {
    Letter.Add(letter, word);
  }
}
Letter.Process();

const keyToRank = (parts: string[]): number => Letter.Rank(parts[0]) + Letter.Rank(parts[1]) * 0.75;

const buildCombinations = (results: string[]): string[] => {
  const word1entries = [...Letter.Available(Letter.bestLetters.slice(8)).entries()];
  const bar = new ProgressBar(":percent complete [:bar] :etas (:total found)", { total: word1entries.length });
  for (const [i1, word1] of word1entries) {
    const word2entries = [...Letter.Available(l(word1)).entries()];
    for (const [i2, word2] of word2entries) {
      const word3entries = [...Letter.Available(l(word1 + word2)).entries()];
      for (const [i3, word3] of word3entries) {
        const result = [word1, word2, word3];
        const key = result.join(",");
        if (results.includes(key)) continue;
        results.push(key);
        if (results.length > 10) results.pop();
        results.sort((a, b) => keyToRank(a.split(",")) - keyToRank(b.split(",")));
        bar.tick(i1, {
          total: results.length,
        });
        writeFileSync("./all.json", JSON.stringify(results, null, 4));
      }
    }
  }
  return results;
};

switch (process.argv.pop()) {
  case "unique": {
    const possible = buildCombinations([]);
    console.log(possible.length, possible.slice(0, 10));
  }
}
