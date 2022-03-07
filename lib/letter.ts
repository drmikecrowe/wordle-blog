export const toL = (a: string | string[]): string[] => [...new Set(Array.isArray(a) ? a : a.split(""))];

import { vowels } from "../weights.json";

export class Letter {
  letter: string;
  words: string[] = [];
  bestWords: string[] = [];
  occurrences: number = 0;
  positions: number[] = [0, 0, 0, 0, 0];
  positionWeight: number[] = [0, 0, 0, 0, 0];
  bestPosition: number = 0;
  rank: number = 0;
  vowelWeight: number = 0;

  constructor(letter: string) {
    this.letter = letter;
    if (["a", "e", "i", "o", "u"].includes(letter)) this.vowelWeight = vowels;
  }

  addWord(word: string) {
    this.words.push(word);
  }

  bumpPosition(offset: number) {
    this.positions[offset]++;
    this.occurrences++;
    this.bestPosition = this.positions.indexOf([...this.positions].sort((a, b) => b - a)[0]);
    const total = this.positions.reduce((acc: number, cur: number) => cur + acc, 0);
    this.positions.forEach((posTotal, i) => {
      this.positionWeight[i] = posTotal / total;
    });
  }
}
