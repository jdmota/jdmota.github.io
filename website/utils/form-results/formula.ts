/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Analyzer } from "./analyzer";
import { limitStringLength, removeAllChildren } from "./utils";

export type FormulaFunction = (
  check: (idx1: number, idx2: number) => boolean
) => boolean;

export class Formula {
  private analyzer: Analyzer;
  private elems: {
    readonly root: HTMLDivElement;
    readonly question: HTMLSelectElement;
    readonly option: HTMLSelectElement;
    readonly buttons: HTMLDivElement;
    readonly expression: HTMLDivElement;
    readonly feedback: HTMLDivElement;
  };
  private arr: string[];
  private str: string[];

  constructor(analyzer: Analyzer) {
    this.analyzer = analyzer;
    const root = document.querySelector("#formula")! as HTMLDivElement;
    this.elems = {
      root,
      question: root.querySelector(".question select")! as HTMLSelectElement,
      option: root.querySelector(".option select")! as HTMLSelectElement,
      buttons: root.querySelector(".buttons")! as HTMLDivElement,
      expression: root.querySelector(".expression")! as HTMLDivElement,
      feedback: root.querySelector(".feedback")! as HTMLDivElement,
    } as const;
    this.arr = [];
    this.str = [];
    this.initialRender();
  }

  private filter() {
    const fn = this.toFunction();
    if (fn) {
      this.elems.feedback.innerText = this.analyzer.filter(fn);
    } else {
      this.elems.feedback.innerText = "Invalid expression!";
    }
  }

  newData() {
    this.none();
    this.renderQuestions();
    this.renderOptionsForQuestion();
    this.renderExpression();
    this.elems.root.classList.remove("hidden");
    this.filter();
  }

  private initialRender() {
    this.elems.question.addEventListener("change", () => {
      this.renderOptionsForQuestion();
    });

    const fns = [
      () => this.addValue(),
      () => this.addAnd(),
      () => this.addOr(),
      () => this.not(),
      () => this.all(),
      () => this.none(),
      () => this.open(),
      () => this.close(),
      () => this.backspace(),
      () => this.filter(),
    ];

    this.elems.buttons.querySelectorAll("button").forEach((button, idx) => {
      button.addEventListener("click", fns[idx]);
    });
  }

  private renderQuestions() {
    removeAllChildren(this.elems.question);

    for (let idx = 0; idx < this.analyzer.questions.length; idx++) {
      const div = document.createElement("option");
      div.innerText = this.analyzer.renderQuestion(idx, 50);
      this.elems.question.appendChild(div);
    }

    this.elems.question.selectedIndex = 0;
  }

  private renderOptionsForQuestion() {
    removeAllChildren(this.elems.option);

    const questionIdx = this.elems.question.selectedIndex;
    const options = this.analyzer.options.get(questionIdx)!;

    for (const option of options) {
      const div = document.createElement("option");
      div.innerText = limitStringLength(option || "------ empty ------");
      this.elems.option.appendChild(div);
    }

    this.elems.option.selectedIndex = 0;
  }

  private renderExpression() {
    this.elems.expression.innerText = this.toString();
  }

  private open() {
    this.arr.push("(");
    this.str.push("(");
    this.renderExpression();
  }

  private close() {
    this.arr.push(")");
    this.str.push(")");
    this.renderExpression();
  }

  private addOr() {
    this.arr.push("||");
    this.str.push("OR");
    this.renderExpression();
  }

  private addAnd() {
    this.arr.push("&&");
    this.str.push("AND");
    this.renderExpression();
  }

  private addValue() {
    const idx1 = this.elems.question.selectedIndex;
    const idx2 = this.elems.option.selectedIndex;

    if (idx1 > -1 && idx2 > -1) {
      const question = limitStringLength(this.analyzer.questions[idx1], 10);
      const options = this.analyzer.options.get(idx1)!;
      const option = limitStringLength(options[idx2], 10);

      this.arr.push(
        "c(%1,%2)".replace(/%1/g, idx1 + "").replace(/%2/g, idx2 + "")
      );
      this.str.push(`[${question} ?: ${option}]`);
    }

    this.renderExpression();
  }

  private not() {
    this.arr.push("!");
    this.str.push("NOT");
    this.renderExpression();
  }

  private none() {
    this.arr.length = 0;
    this.str.length = 0;
    this.renderExpression();
  }

  private all() {
    this.arr.length = 0;
    this.str.length = 0;
    this.arr.push("true");
    this.str.push("ALL");
    this.renderExpression();
  }

  private backspace() {
    this.arr.pop();
    this.str.pop();
    this.renderExpression();
  }

  private toString() {
    return this.str.join(" ") || "NONE";
  }

  private toFunction(): FormulaFunction | undefined {
    let fn;
    let body = this.arr.join("") || "false";
    try {
      fn = new Function("c", "return " + body + ";") as FormulaFunction;
    } catch (err: any) {
      // Empty
      console.log(err);
    }
    if (fn) {
      // Make sure no runtime error will occur
      try {
        fn(() => true);
      } catch (err) {
        console.log(fn, err);
        fn = undefined;
      }
    }
    return fn;
  }
}
