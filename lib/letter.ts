export const toL = (a: string | string[]): string[] => [...new Set(Array.isArray(a) ? a : a.split(""))];

export class Letter {
  letter: string;
  words: string[] = [];
  bestWords: string[] = [];
  occurrences: number = 0;
  positions: number[] = [0, 0, 0, 0, 0];
  bestPosition: number = 0;
  rank: number = 0;

  constructor(letter: string) {
    this.letter = letter;
  }

  addWord(word: string) {
    this.words.push(word);
  }

  bumpPosition(offset: number) {
    this.positions[offset]++;
    this.occurrences++;
    this.bestPosition = this.positions.indexOf([...this.positions].sort((a, b) => b - a)[0]);
  }
}
