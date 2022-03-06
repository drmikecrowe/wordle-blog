import { buildCombinations, Process } from "./analyze";

Process();

switch (process.argv.pop()) {
  case "unique": {
    const possible = buildCombinations();
    console.log(possible.length, possible.slice(0, 10));
  }
}
