import { toL as toLetterAry } from "./letter";
import { letterMap, log_rank, wordRanks } from "./BuildCombinations";

export function PositionHits(word: string): number {
  let hits = 0;
  for (const [pos, letter] of toLetterAry(word).entries()) {
    if (pos === letterMap[letter].bestPosition) hits++;
  }
  return hits;
}

export function DetailRank(word: string, offset: number): { rank: number; detail: any } {
  const detail: any = {};
  const letters = toLetterAry(word);
  let posHits = 0;
  let rank = 0;
  for (const [pos, letter] of letters.entries()) {
    const lm = letterMap[letter];
    detail[`W${offset}L${pos}-Rank`] = lm.rank;
    let r = lm.rank;
    r += lm.positionWeight[pos];
    r += lm.vowelWeight;
    if (pos === lm.bestPosition) {
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

export function Rank(word: string): number {
  if (wordRanks[word]) return wordRanks[word];
  const { rank } = DetailRank(word, 0);
  wordRanks[word] = rank;
  return rank;
}
