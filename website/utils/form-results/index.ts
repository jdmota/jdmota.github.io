import { Importer } from "./importer";
import { Formula } from "./formula";
import { Analyzer } from "./analyzer";

const analyzer = new Analyzer();

const formula = new Formula(analyzer);

new Importer({
  newData: data => {
    analyzer.newData(data);
    formula.newData();
  },
});
