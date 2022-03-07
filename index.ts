import { BuildCombinations, Prepare } from "./lib/BuildCombinations";
import { RankWordSets } from "./lib/RankWordSets";
import { existsSync, readFileSync } from "fs";

Prepare();

switch (process.argv.pop()) {
  case "build":
    BuildCombinations();
    break;
  case "unique":
  default: {
    if (existsSync("bestWordCombinations.json")) {
      const bestWordCombinations = JSON.parse(readFileSync("bestWordCombinations.json", "utf-8"));
      const possible = RankWordSets(bestWordCombinations);
      console.log(possible.length, possible.slice(0, 10));
    } else {
      console.log(`ERROR: not words built yet`);
    }
  }
}
