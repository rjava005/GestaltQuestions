type Token = { type: "number" | "name" | "symbol" | "eof"; value: string };

export type FormulaNode =
  | { kind: "number"; value: string }
  | { kind: "name"; value: string }
  | { kind: "unary"; operator: "+" | "-"; operand: FormulaNode }
  | {
      kind: "binary";
      operator: "+" | "-" | "*" | "/" | "^";
      left: FormulaNode;
      right: FormulaNode;
    }
  | { kind: "call"; name: string; argument: FormulaNode };

export const FORMULA_FUNCTIONS = new Set([
  "sqrt",
  "abs",
  "exp",
  "log",
  "sin",
  "cos",
  "tan",
]);
export const FORMULA_CONSTANTS = new Set(["pi", "e"]);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const whitespace = /^\s+/.exec(rest);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
    if (number) {
      tokens.push({ type: "number", value: number[0] });
      index += number[0].length;
      continue;
    }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (name) {
      tokens.push({ type: "name", value: name[0] });
      index += name[0].length;
      continue;
    }
    if ("+-*/^()".includes(source[index])) {
      tokens.push({ type: "symbol", value: source[index] });
      index += 1;
      continue;
    }
    throw new Error(`Unsupported token "${source[index]}".`);
  }
  tokens.push({ type: "eof", value: "" });
  return tokens;
}

export function parseFormula(source: string): FormulaNode {
  if (!source.trim()) throw new Error("Formula is required.");
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const consume = (value?: string) => {
    const token = tokens[position];
    if (value !== undefined && token.value !== value) {
      throw new Error(`Expected "${value}" but found "${token.value || "end"}".`);
    }
    position += 1;
    return token;
  };

  const primary = (): FormulaNode => {
    const token = peek();
    if (token.type === "number") {
      consume();
      return { kind: "number", value: token.value };
    }
    if (token.type === "name") {
      consume();
      if (peek().value === "(") {
        if (!FORMULA_FUNCTIONS.has(token.value)) {
          throw new Error(`Function "${token.value}" is not supported.`);
        }
        consume("(");
        const argument = expression();
        consume(")");
        return { kind: "call", name: token.value, argument };
      }
      return { kind: "name", value: token.value };
    }
    if (token.value === "(") {
      consume("(");
      const node = expression();
      consume(")");
      return node;
    }
    throw new Error(`Expected a number, parameter, or parenthesis.`);
  };

  const unary = (): FormulaNode => {
    if (peek().value === "+" || peek().value === "-") {
      const operator = consume().value as "+" | "-";
      return { kind: "unary", operator, operand: unary() };
    }
    return primary();
  };
  const power = (): FormulaNode => {
    const left = unary();
    if (peek().value === "^") {
      consume("^");
      return { kind: "binary", operator: "^", left, right: power() };
    }
    return left;
  };
  const product = (): FormulaNode => {
    let node = power();
    while (peek().value === "*" || peek().value === "/") {
      const operator = consume().value as "*" | "/";
      node = { kind: "binary", operator, left: node, right: power() };
    }
    return node;
  };
  const expression = (): FormulaNode => {
    let node = product();
    while (peek().value === "+" || peek().value === "-") {
      const operator = consume().value as "+" | "-";
      node = { kind: "binary", operator, left: node, right: product() };
    }
    return node;
  };

  const result = expression();
  if (peek().type !== "eof") {
    throw new Error(`Unexpected token "${peek().value}".`);
  }
  return result;
}

export function formulaReferences(node: FormulaNode): Set<string> {
  const refs = new Set<string>();
  const visit = (part: FormulaNode) => {
    if (part.kind === "name" && !FORMULA_CONSTANTS.has(part.value)) refs.add(part.value);
    if (part.kind === "unary") visit(part.operand);
    if (part.kind === "binary") {
      visit(part.left);
      visit(part.right);
    }
    if (part.kind === "call") visit(part.argument);
  };
  visit(node);
  return refs;
}

export function emitFormula(node: FormulaNode, runtime: "python" | "javascript"): string {
  if (node.kind === "number") return node.value;
  if (node.kind === "name") {
    if (FORMULA_CONSTANTS.has(node.value)) {
      return runtime === "python" ? `math.${node.value}` : `Math.${node.value === "pi" ? "PI" : "E"}`;
    }
    return node.value;
  }
  if (node.kind === "unary") return `(${node.operator}${emitFormula(node.operand, runtime)})`;
  if (node.kind === "binary") {
    const operator = node.operator === "^" ? "**" : node.operator;
    return `(${emitFormula(node.left, runtime)} ${operator} ${emitFormula(node.right, runtime)})`;
  }
  const functionName = runtime === "python"
    ? `math.${node.name}`
    : node.name === "abs" ? "Math.abs" : `Math.${node.name}`;
  return `${functionName}(${emitFormula(node.argument, runtime)})`;
}

