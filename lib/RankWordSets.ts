import { writeFileSync } from "fs";
import ProgressBar from "progress";
import { Rank, DetailRank, PositionHits } from "./Rank";

import { first, second, third } from "../weights.json";

interface Results {
  words: string[];
  rank: number;
  output: string;
  posHits?: number;
}

export function RankWordSetsDetails(bestWordCombinations: string[][]): string[] {
  const keys: string[] = [];
  const results: Results[] = [];
  const details: any[] = [];

  const bar = new ProgressBar(":percent [:bar] :etas", { total: bestWordCombinations.length });
  bar.interrupt(`Analysis Loops: ${bestWordCombinations.length}`);

  for (const [word1, word2, word3] of bestWordCombinations) {
    const words = [word1, word2, word3];
    const key = words.join(",");
    if (keys.includes(key)) continue;

    const { rank: word1rank, detail: detail1 } = DetailRank(word1, 1);
    const { rank: word2rank, detail: detail2 } = DetailRank(word2, 2);
    const { rank: word3rank, detail: detail3 } = DetailRank(word3, 3);
    const detail = {
      word1,
      word1rank: word1rank * first,
      ...detail1,
      word2,
      word2rank: word2rank * second,
      ...detail2,
      word3,
      word3rank: word3rank * third,
      ...detail3,
      combRank: word1rank * first + word2rank * second + word3rank * third,
      posHits: detail1["W1-posHits"] + detail2["W2-posHits"] + detail3["W3-posHits"],
    };

    details.push(detail);

    const outputs: string[] = [];
    outputs.push(`rank=${detail.combRank.toFixed(2)}`);
    outputs.push(`${detail.word1rank.toFixed(2)}/${detail.word2rank.toFixed(2)}/${detail.word3rank.toFixed(2)}`);
    outputs.push(`posHits=${detail.posHits}`);
    const result: Results = {
      words,
      rank: detail.combRank,
      posHits: detail.posHits,
      output: `${key}: ${outputs.join(", ")}`,
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

    bar.tick();
  }
  return results.map((r) => r.output).slice(0, 10);
}

export function RankWordSets(bestWordCombinations: string[][]): string[] {
  const results: Results[] = [];

  const bar = new ProgressBar(":percent [:bar] :etas", { total: bestWordCombinations.length });
  bar.interrupt(`Analysis Loops: ${bestWordCombinations.length}`);

  for (const [word1, word2, word3] of bestWordCombinations) {
    const words = [word1, word2, word3];
    const key = words.join(",");

    const word1rank = Rank(word1);
    const word2rank = Rank(word2);
    const word3rank = Rank(word3);
    const posHits = PositionHits(word1) + PositionHits(word2) + PositionHits(word3);

    const combRank = word1rank * first + word2rank * second + word3rank * third;

    const outputs: string[] = [];
    outputs.push(`rank=${combRank.toFixed(2)}`);
    outputs.push(`${word1rank.toFixed(2)}/${word2rank.toFixed(2)}/${word3rank.toFixed(2)}`);
    outputs.push(`posHits=${posHits}`);
    const result: Results = {
      words,
      rank: combRank,
      output: `${key}: ${outputs.join(", ")}`,
    };
    let found = false;
    for (const [i, existing] of results.entries()) {
      if (combRank > existing.rank) {
        results.splice(i, 0, result);
        found = true;
        break;
      }
    }
    if (results.length > 100) results.pop();
    if (!found) results.push(result);
    writeFileSync("./all.json", JSON.stringify(results.map((r) => r.output).slice(0, 10), null, 4));

    bar.tick();
  }
  return results.map((r) => r.output).slice(0, 10);
}
