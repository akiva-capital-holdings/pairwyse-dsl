class Stack {
  stack: string[] = [];

  length() {
    return this.stack.length;
  }

  push(value: string) {
    // console.log(`stack push: ${value}`);
    this.stack.push(value);
  }

  pop() {
    // console.log(`stack pop: ${this.seeLast()}`);
    return this.stack.pop();
  }

  view() {
    return this.stack[this.stack.length - 1];
  }
}

const isOperator = (op: string) => ["==", "!", "<", ">", "swap", "<=", ">=", "xor", "and", "or", "!="].includes(op);

const opsPriors = (op: string) => {
  if (op === "!") return 4;
  if (["<", ">", ">=", "<=", "==", "!="].includes(op)) return 3;
  if (["swap", "and"].includes(op)) return 2;
  if (["xor", "or"].includes(op)) return 1;
  return 0;
};

const transform = (expr: string) =>
  expr
    .replaceAll("(", "@(@")
    .replaceAll(")", "@)@")
    .split(/[@ \n]/g)
    .filter((x: string) => !!x);

function convert(expr: string) {
  const stack = new Stack();
  const result = [];
  const exprArr = transform(expr);

  exprArr.forEach((chunk) => {
    if (isOperator(chunk)) {
      // console.log(`'${chunk}' is an operator`);
      // +, -, *, /
      while (stack.length() && opsPriors(chunk) <= opsPriors(stack.view())) {
        // console.log(`result push: ${stack.view()}`);
        result.push(stack.pop());
      }
      stack.push(chunk);
    } else if (chunk === "(") {
      stack.push(chunk);
    } else if (chunk === ")") {
      while (stack.view() !== "(") {
        // console.log(`result push: ${stack.view()}`);
        result.push(stack.pop());
      }
      stack.pop(); // remove '(' that is left
    } else {
      // operand found
      // console.log(`result push: ${chunk}`);
      result.push(chunk);
    }
  });

  while (stack.length()) {
    // console.log(`result push: ${stack.view()}`);
    result.push(stack.pop());
  }

  return result; // .reduce((p, c) => p + c, '');
}

export default convert;
