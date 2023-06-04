/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Papa from "papaparse";
import { removeAllChildren } from "./utils";

export type Answer = string | readonly string[];
export type Row = readonly Answer[];

const ANSWER_SEP = ["\n", ";", ","];

export type ImporterOpts = Readonly<{
  newData: (data: Data) => void;
}>;

export type Data = Readonly<{
  headerRow: readonly string[];
  rows: readonly Row[];
  multipleAnswers: ReadonlySet<number>;
}>;

export class Importer {
  private readonly elems: {
    readonly fileInput: HTMLInputElement;
    readonly importButton: HTMLButtonElement;
    readonly smartSplit: HTMLTextAreaElement;
    readonly warnings: HTMLDivElement;
    readonly warningsTitle: HTMLElement;
  };
  private opts: ImporterOpts;
  private processHeader: boolean;
  private headerRow: readonly string[];
  private rows: Row[];
  private multipleAnswers: ReadonlySet<number>;
  private lastFile: File | null;
  private lastMultipleAnswers: string;

  constructor(opts: ImporterOpts) {
    this.elems = {
      fileInput: document.querySelector("#file input")! as HTMLInputElement,
      importButton: document.querySelector(
        "#import button"
      )! as HTMLButtonElement,
      smartSplit: document.querySelector(
        "#smart-split textarea"
      )! as HTMLTextAreaElement,
      warnings: document.querySelector("#warnings")! as HTMLDivElement,
      warningsTitle: document.querySelector("#warnings-title")! as HTMLElement,
    } as const;
    this.opts = opts;
    this.processHeader = true;
    this.headerRow = [];
    this.rows = [];
    this.multipleAnswers = new Set();
    this.lastFile = null;
    this.lastMultipleAnswers = "";
    this.initialRender();
  }

  private initialRender() {
    this.elems.importButton.addEventListener("click", () => {
      const files = this.elems.fileInput.files;
      if (files != null && files.length > 0) {
        this.elems.importButton.disabled = true;
        this.import(files[0], this.elems.smartSplit.value);
      } else {
        this.resetWarnings();
        this.sendWarning("No file!");
      }
    });
  }

  private reset(file: File, multipleAnswers: string) {
    this.processHeader = true;
    this.headerRow = [];
    this.rows = [];
    this.multipleAnswers = new Set();
    this.lastFile = file;
    this.lastMultipleAnswers = multipleAnswers;
    this.resetWarnings();
  }

  private import(file: File, multipleAnswers: string) {
    if (
      this.lastFile !== file ||
      this.lastMultipleAnswers !== multipleAnswers
    ) {
      this.reset(file, multipleAnswers);
      this.parse(file);
    } else {
      this.done(null);
    }
  }

  private resetWarnings() {
    removeAllChildren(this.elems.warnings);
    this.elems.warningsTitle.innerText = `0 import warnings`;
  }

  private sendWarning(message: string) {
    const div = document.createElement("div");
    div.innerText = message;
    this.elems.warnings.appendChild(div);

    const count = this.elems.warnings.childElementCount;
    this.elems.warningsTitle.innerText = `${count} import warning${
      count === 1 ? "" : "s"
    }`;
  }

  private done(data: Data | null) {
    this.elems.importButton.disabled = false;
    if (data) {
      this.opts.newData(data);
    }
  }

  private processMultipleAnswers() {
    const multiples = this.lastMultipleAnswers
      .split("\n")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const set = new Set<number>();

    for (const question of multiples) {
      let found = false;

      for (let idx = 0; idx < this.headerRow.length; idx++) {
        const header = this.headerRow[idx];
        if (header.toLowerCase().includes(question)) {
          set.add(idx);
          found = true;
        }
      }

      if (!found) {
        this.sendWarning(
          `Could not find column for question ${JSON.stringify(question)}`
        );
      }
    }

    this.multipleAnswers = set;
  }

  private transformAnswer(questionIdx: number, value: string): Answer {
    if (this.multipleAnswers.has(questionIdx)) {
      const sep = ANSWER_SEP.find(sep => value.includes(sep));
      if (sep) {
        return value
          .split(sep)
          .map(s => s.trim())
          .filter(Boolean);
      }
      return [value.trim()];
    }
    return value.trim();
  }

  private parse(file: File) {
    Papa.parse<string[]>(file, {
      dynamicTyping: false,
      step: row => {
        if (this.processHeader) {
          this.headerRow = row.data.map(s => s.trim()).filter(Boolean);
          this.processMultipleAnswers();
          this.processHeader = false;
        } else {
          this.rows.push(
            row.data
              .slice(0, this.headerRow.length)
              .map((s, idx) => this.transformAnswer(idx, s))
          );
        }
        for (const error of row.errors) {
          this.sendWarning(error.message);
        }
      },
      error: error => {
        this.sendWarning(`ERROR: ${error.message}`);
        this.done(null);
      },
      complete: () => {
        if (this.headerRow.length === 0) {
          this.sendWarning(`ERROR: zero columns`);
          this.done(null);
        } else {
          this.done({
            headerRow: this.headerRow,
            rows: this.rows,
            multipleAnswers: this.multipleAnswers,
          });
        }
      },
    });
  }
}
