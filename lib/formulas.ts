/**
 * Formula evaluation for the spreadsheet.
 * Supports: =A1+B1, =A1-B1, =A1*B1, =A1/B1 and =SUM(A1:A5).
 */

export type FormulaResult = string | number | null;

const ERROR_RESULT: FormulaResult = "#ERROR!";

/**
 * Get numeric value from a cell's stored value (handles formulas recursively).
 */
function getCellNumericValue(
  cellId: string,
  cells: Record<string, string>,
  visited: Set<string>
): number {
  if (visited.has(cellId)) return NaN;
  visited.add(cellId);
  const raw = cells[cellId] ?? "";
  if (raw === "") {
    visited.delete(cellId);
    return 0;
  }
  if (raw.startsWith("=")) {
    const result = evaluateFormula(raw, cells, visited);
    visited.delete(cellId);
    if (typeof result === "number") return result;
    if (result === null) return 0;
    const n = parseFloat(String(result));
    return Number.isNaN(n) ? 0 : n;
  }
  const n = parseFloat(raw);
  visited.delete(cellId);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Parse a range like "A1:A5" into an array of cell IDs.
 */
function parseRange(range: string): string[] {
  const m = range.match(/^\s*([A-Z]+)(\d+)\s*:\s*([A-Z]+)(\d+)\s*$/i);
  if (!m) return [];
  const [, sc, sr, ec, er] = m;
  const startCol = columnLettersToIndex(sc!);
  const startRow = parseInt(sr!, 10);
  const endCol = columnLettersToIndex(ec!);
  const endRow = parseInt(er!, 10);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const ids: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      ids.push(columnIndexToLetter(c) + r);
    }
  }
  return ids;
}

function columnLettersToIndex(letters: string): number {
  let idx = 0;
  const s = letters.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    idx = idx * 26 + (s.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function columnIndexToLetter(index: number): string {
  let s = "";
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Evaluate SUM(A1:A5) - sum numeric values in range.
 */
function evaluateSum(
  inner: string,
  cells: Record<string, string>,
  visited: Set<string>
): FormulaResult {
  const ids = parseRange(inner);
  if (ids.length === 0) return ERROR_RESULT;
  let sum = 0;
  for (const id of ids) {
    sum += getCellNumericValue(id, cells, visited);
  }
  return sum;
}

/**
 * Evaluate simple arithmetic: replace cell refs with values, then apply * / then + -.
 */
function evaluateArithmetic(
  expr: string,
  cells: Record<string, string>,
  visited: Set<string>
): FormulaResult {
  const cellRefRegex = /[A-Z]+\d+/gi;
  let replaced = expr.replace(cellRefRegex, (ref) => {
    const num = getCellNumericValue(ref.toUpperCase(), cells, visited);
    return String(num);
  });
  replaced = replaced.replace(/\s+/g, "");
  const tokens: (number | string)[] = [];
  let i = 0;
  while (i < replaced.length) {
    if (/[0-9.]/.test(replaced[i])) {
      let num = "";
      while (i < replaced.length && /[0-9.]/.test(replaced[i])) {
        num += replaced[i++];
      }
      tokens.push(parseFloat(num));
      continue;
    }
    if ("+-*/".includes(replaced[i])) {
      tokens.push(replaced[i++]);
      continue;
    }
    return ERROR_RESULT;
  }
  if (tokens.length === 0) return null;
  if (tokens.length === 1 && typeof tokens[0] === "number") return tokens[0];

  const applyMulDiv: (number | string)[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const t = tokens[j];
    if (t === "*" || t === "/") {
      const a = applyMulDiv.pop();
      const b = tokens[j + 1];
      if (typeof a !== "number" || typeof b !== "number") return ERROR_RESULT;
      applyMulDiv.push(t === "*" ? a * b : b === 0 ? NaN : a / b);
      j++;
    } else if (typeof t === "number") {
      applyMulDiv.push(t);
    } else {
      applyMulDiv.push(t);
    }
  }
  let result = applyMulDiv[0];
  if (typeof result !== "number") return ERROR_RESULT;
  for (let j = 1; j < applyMulDiv.length; j += 2) {
    const op = applyMulDiv[j];
    const next = applyMulDiv[j + 1];
    if (op === "+") result += next as number;
    else if (op === "-") result -= next as number;
    else return ERROR_RESULT;
  }
  return Number.isNaN(result) ? ERROR_RESULT : result;
}

/**
 * Evaluate a formula string and return the calculated value.
 * - Formulas start with "=".
 * - Supports: =A1+B1, =A1-B1, =A1*B1, =A1/B1 and =SUM(A1:A5).
 * - When a referenced cell contains a formula, it is evaluated recursively.
 * - Circular references produce #ERROR!.
 */
export function evaluateFormula(
  formula: string,
  cells: Record<string, string>,
  visited?: Set<string>
): FormulaResult {
  if (!formula.startsWith("=")) return null;
  const visitedSet = visited ?? new Set<string>();
  const expr = formula.slice(1).trim();
  if (!expr) return null;

  const sumMatch = expr.match(/^SUM\s*\(\s*([A-Z]+\d+\s*:\s*[A-Z]+\d+)\s*\)$/i);
  if (sumMatch) {
    return evaluateSum(sumMatch[1], cells, visitedSet);
  }

  return evaluateArithmetic(expr, cells, visitedSet);
}

/**
 * Get the display value for a cell: if it's a formula, return the evaluated result; otherwise the raw value.
 */
export function getDisplayValue(
  rawValue: string,
  cells: Record<string, string>
): string {
  if (rawValue === "") return "";
  if (!rawValue.startsWith("=")) return rawValue;
  const result = evaluateFormula(rawValue, cells);
  if (result === null) return "";
  return String(result);
}
