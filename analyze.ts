import { words as wordList } from "./words";

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

    static Sort(): void {
        Letter.letters.sort((a, b) => b.rank - a.rank);
    }

    static Best(): string[] {
        Letter.sortedLetters = Letter.letters.map((l) => l.letter);
        Letter.bestLetters = Letter.sortedLetters.slice(0, 15);
        return Letter.bestLetters;
    }

    static Rank(word: string, verbose = false): number {
        const best = Letter.Best();
        let rank = 0;
        for (const letter of word.split("")) {
            let i = best.indexOf(letter);
            if (i === -1) i = 100;
            if (verbose) console.log(`${letter}: ${i}`);
            rank += i;
        }
        return rank;
    }

    static Filter(l: Letter, checkLetters: string[], max: number): string[] {
        let words: string[] = [];
        l.words.forEach((word) => {
            const intersection = checkLetters.filter((x) =>
                word.split("").includes(x)
            );
            if (intersection.length >= max) words.push(word);
        });
        return words;
    }
}

for (const word of Object.keys(wordList)) {
    for (const letter of word.split("")) {
        Letter.Add(letter, word);
    }
}
Letter.Sort();
Letter.Best();

const MAX = 4;

const findUniqueWords = (
    start = 0,
    checkLetters = Letter.bestLetters,
    pendingWords: string[] = []
): string[] => {
    for (const l of Letter.letters.slice(start, 15)) {
        const words = Letter.Filter(l, checkLetters, MAX);
        console.log(`For ${l.letter}, we have ${words.length} words which has ${checkLetters.join(",")}`)
        for (const word of words) {
            const remainingLetters = checkLetters.filter(
                (x) => !word.split("").includes(x)
            );
            pendingWords.push(word);
            console.log('PENDING: ', start, pendingWords, checkLetters.join(","));
            return findUniqueWords(start, remainingLetters, pendingWords);
        }
    }
    if (pendingWords.length === 3) {
        console.log(pendingWords);
        return pendingWords;
    }
    return pendingWords
};

switch (process.argv.pop()) {
    case "best-letters":
        {
            const best = Letter.Best();
            console.log(best);
        }
        break;
    case "best-rank":
        {
            const best = Letter.Best();
            console.log(
                best.map((letter, i) => `* ${letter} - ${i}`).join("\n")
            );
        }
        break;
    case "rank-word":
        {
            const word = Letter.letters[0].words[0];
            console.log(Letter.Rank(word, true));
        }
        break;
    case "unique": {
        findUniqueWords();
    }
}
