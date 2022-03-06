# How Can I Wordle Out of Real Work?

Let me start this with a confession:

> I don't (technically) play Wordle

This is very important, as recently my wife came to me and proclaimed "I just got a magnificent in Wordle" (the blank look on my face definitely bumped up my heating bill for a few days).  When I asked my daughter if she played it, she pointed me to [Word Master](https://octokatherine.github.io/word-master/) and I was hooked.

Many discussions (with my daughter -- my wife had no interest in our flagrant disrespect of Wordle) ensued about best words to start.  For the longest, mine were `train`, `speck`, `dough`.  You see, our philosophy was to bank out 2-3 words and get the letters, then stress over guessing the word after establishing a good bank of letters.  I searched online for the best 3 letters, but nobody seemed to follow this technique.  So, off I went to figure it out.

But first, take another look at `octokatherine`'s creation:  Open source, hosted in github, quite a few contributors, pull-requests, issues.  Wow, just wow. 

The idea of a blog post started in the idle thought of "How would you determine the top 3 best words to start with?".  Then it spiraled into thoughts of recursion (determine the best first work, then all the best second words, etc).  I then realized that I needed to jump into it and start this because I was going to obsess about it in my head until I did.

The first challenge was determining how to track letters.  I came up with this class:

```ts
export class Letter {
  letter: string;
  words: string[] = [];
  occurrences: number = 0;
  positions: number[] = [0, 0, 0, 0, 0];
  bestPosition: number = 0;
  letterRank: number = 0;

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

```


The first real-results looked like this:

```
letters:verbose Best letters: e,s,a,r,o,i,l,t,n,u,d,c,p,m,h +1ms
letters:verbose * e - 1, pos: 4
letters:verbose * s - 2, pos: 5
letters:verbose * a - 3, pos: 2
letters:verbose * r - 4, pos: 3
letters:verbose * o - 5, pos: 2
letters:verbose * i - 6, pos: 2
letters:verbose * l - 7, pos: 3
letters:verbose * t - 8, pos: 1
letters:verbose * n - 9, pos: 3
letters:verbose * u - 10, pos: 2
letters:verbose * d - 11, pos: 1
letters:verbose * c - 12, pos: 1
letters:verbose * p - 13, pos: 1
letters:verbose * m - 14, pos: 1
letters:verbose * h - 15, pos: 2

[
  'tiles,dunam,porch: rank=4.1, posHits=11',
  'tiles,dunam,porch: rank=4.1, posHits=11',
  'tires,dolma,punch: rank=4.1, posHits=11',
  'tires,dolma,punch: rank=4.1, posHits=11',
  'toles,diram,punch: rank=4.1, posHits=11',
  'toles,pardi,munch: rank=4.1, posHits=11',
  'toles,pardi,munch: rank=4.1, posHits=11',
  'toles,diram,punch: rank=4.1, posHits=11',
  'tores,milpa,dunch: rank=4.1, posHits=11',
  'tores,milpa,dunch: rank=4.1, posHits=11'
]
```