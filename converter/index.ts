class Stack {
  stack: string[] = [];

  length() {
    return this.stack.length;
  }

  push(value: string) {
    this.stack.push(value);
  }

  pop() {
    return this.stack.pop();
  }

  view() {
    return this.stack[this.stack.length - 1];
  }
}

const isOperator = (op: string) => ['==', '!', '<', '>', 'swap', '<=', '>=', 'xor', 'and', 'or', '!='].includes(op);

const opsPriors = (op: string) => {
  if (op === '!') return 1;
  if (['<', '>', '>=', '<=', '==', '!='].includes(op)) return 2;
  if (['swap', 'and'].includes(op)) return 3;
  if (['xor', 'or'].includes(op)) return 4;
  return Number.MAX_VALUE;
};

const transform = (expr: string) => expr
  .replaceAll('(', '@(@')
  .replaceAll(')', '@)@')
  .split(/[@ \n]/g)
  .filter((x: string) => !!x);

function convert(expr: string) {
  const stack = new Stack();
  const result = [];
  const exprArr = transform(expr);
  // console.log({ exprArr });

  exprArr.forEach((chunk) => {
    if (isOperator(chunk)) {
      // console.log(`'${chunk}' is an operator`);
      // +, -, *, /
      while (stack.length() && opsPriors(chunk) >= opsPriors(stack.view())) {
        result.push(stack.pop());
      }
      stack.push(chunk);
    } else if (chunk === '(') {
      stack.push(chunk);
    } else if (chunk === ')') {
      while (stack.view() !== '(') {
        result.push(stack.pop());
      }
      stack.pop(); // remove '(' that is left
    } else {
      // operand found
      result.push(chunk);
    }
  });

  while (stack.length()) {
    result.push(stack.pop());
  }

  return result; // .reduce((p, c) => p + c, '');
}

export default convert;
