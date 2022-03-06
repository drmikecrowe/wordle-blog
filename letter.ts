export const toL = (a: string | string[]): string[] => [...new Set(Array.isArray(a) ? a : a.split(""))];

export class Letter {
  letter: string;
  words: string[];

  constructor(letter: string, word: string) {
    this.letter = letter;
    this.words = [word];
  }

  newWord(word: string) {
    this.words.push(word);
  }
}
