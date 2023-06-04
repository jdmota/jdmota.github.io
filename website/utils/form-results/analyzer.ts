/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { FormulaFunction } from "./formula";
import type { Data, Row } from "./importer";
import {
  limitStringLength,
  printPercentage,
  printString,
  removeAllChildren,
  toArray,
} from "./utils";

export class Analyzer {
  private readonly elems: {
    readonly results: HTMLDivElement;
    readonly header: HTMLElement;
    readonly tableBody: HTMLElement;
    readonly projections: HTMLElement;
  };

  private rows: readonly Row[];
  questions: readonly string[];
  multipleAnswers: ReadonlySet<number>;
  options: ReadonlyMap<number, readonly string[]>;

  constructor() {
    this.elems = {
      results: document.querySelector("#results")! as HTMLDivElement,
      header: document.querySelector("#results thead tr")! as HTMLElement,
      tableBody: document.querySelector("#results tbody")! as HTMLElement,
      projections: document.querySelector("#projections tbody")! as HTMLElement,
    };
    this.rows = [];
    this.questions = [];
    this.multipleAnswers = new Set();
    this.options = new Map();
  }

  newData(data: Data) {
    this.rows = data.rows;
    this.questions = data.headerRow;
    this.multipleAnswers = data.multipleAnswers;

    const options = new Map<number, Set<string>>();
    for (let i = 0; i < this.questions.length; i++) {
      options.set(i, new Set());
    }

    for (const row of data.rows) {
      for (let i = 0; i < row.length; i++) {
        const answer = row[i];
        const set = options.get(i)!;
        if (typeof answer === "string") {
          set.add(answer);
        } else {
          answer.forEach(a => set.add(a));
        }
      }
    }

    this.options = new Map(
      Array.from(options).map(([question, options]) => [
        question,
        Array.from(options).sort(),
      ])
    );
  }

  renderQuestion(idx: number, limit = 20000) {
    const question = this.questions[idx];
    const multiple = this.multipleAnswers.has(idx);
    return (multiple ? "[*] " : "[1] ") + limitStringLength(question, limit);
  }

  filter(fn: FormulaFunction) {
    removeAllChildren(this.elems.header);
    removeAllChildren(this.elems.tableBody);
    removeAllChildren(this.elems.projections);

    for (let idx = 0; idx < this.questions.length; idx++) {
      const th = document.createElement("th");
      th.innerText = this.renderQuestion(idx, 50);
      this.elems.header.appendChild(th);
    }

    const total = this.rows.length;
    let count = 0;

    const projection = new Map<number, Map<string, number>>();
    for (let i = 0; i < this.questions.length; i++) {
      projection.set(i, new Map());
    }

    for (const row of this.rows) {
      const check = (idx1: number, idx2: number) => {
        const answer = toArray(row[idx1]);
        const expected = this.options.get(idx1)![idx2];
        return answer.includes(expected);
      };

      if (fn(check)) {
        count++;

        for (let questionIdx = 0; questionIdx < row.length; questionIdx++) {
          const answer = toArray(row[questionIdx]);
          for (const a of answer) {
            const counts = projection.get(questionIdx)!;
            const current = counts.get(a) ?? 0;
            counts.set(a, current + 1);
          }
        }

        const tr = document.createElement("tr");
        for (const answer of row) {
          const td = document.createElement("td");
          td.innerText = toArray(answer).map(printString).join("\n");
          tr.appendChild(td);
        }
        this.elems.tableBody.appendChild(tr);
      }
    }

    const filteredTotal = count;

    for (const [questionIdx, answers] of projection) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.innerText = this.renderQuestion(questionIdx);
      tr.appendChild(td);
      tr.style.fontWeight = "bold";
      this.elems.projections.appendChild(tr);

      for (const [answer, count] of answers) {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.innerText = printString(answer);
        const td2 = document.createElement("td");
        td2.innerText = `${count} of ${filteredTotal} (${printPercentage(
          count,
          filteredTotal
        )})`;
        tr.appendChild(td1);
        tr.appendChild(td2);
        this.elems.projections.appendChild(tr);
      }
    }

    return `${filteredTotal} filtered results out of ${total} (${printPercentage(
      filteredTotal,
      total
    )})`;
  }
}
