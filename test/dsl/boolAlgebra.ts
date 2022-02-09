import { ethers } from 'hardhat';
import { App, Context, Parser, Stack, StackValue__factory } from '../../typechain';
import { checkStack } from '../utils/utils';

describe('Boolean Algebra', () => {
  let stack: Stack;
  let ctx: Context;
  let app: App;
  let parser: Parser;
  let StackValue: StackValue__factory;

  before(async () => {
    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address },
    });
    parser = await ParserCont.deploy();

    // Deploy Context
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    await ctx.setComparatorOpcodesAddr(comparatorOpcodesLib.address);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLib.address);
    await ctx.setSetOpcodesAddr(setOpcodesLib.address);
    await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);

    // Deploy Application
    app = await (
      await ethers.getContractFactory('App', { libraries: { Executor: executorLib.address } })
    ).deploy(parser.address, ctx.address);
  });

  describe('Commutative law', async () => {
    async function testCase(op: 'and' | 'or' | 'xor', a: boolean, b: boolean) {
      await app.parse(
        `
          bool ${a.toString()} ${op} bool ${b.toString()}
          ==
          bool ${b.toString()} ${op} bool ${a.toString()}
          `
      );
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    }

    describe('A & B <=> B & A', async () => {
      it('T & F <=> F & T', async () => testCase('and', true, false));
      it('F & T <=> T & F', async () => testCase('and', false, true));
    });

    describe('A | B <=> B | A', async () => {
      it('T | F <=> F | T', async () => testCase('or', true, false));
      it('F | T <=> T | F', async () => testCase('or', false, true));
    });

    describe('A xor B <=> B xor A', async () => {
      it('T xor F <=> F xor T', async () => testCase('xor', true, false));
      it('F xor T <=> T xor F', async () => testCase('xor', false, true));
    });
  });

  describe('Associative law', async () => {
    async function testCase(op: 'and' | 'or' | 'xor', a: boolean, b: boolean, c: boolean) {
      const A = a.toString();
      const B = b.toString();
      const C = c.toString();

      await app.parse(
        `
          (bool ${A} ${op} bool ${B}) ${op} bool ${C}
          ==
          bool ${A} ${op} (bool ${B} ${op} bool ${C})
          `
      );
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    }

    describe('(A & B) & C <=> A & (B & C)', async () => {
      it('(F & F) & F <=> F & (F & F)', async () => testCase('and', false, false, false));
      it('(F & F) & T <=> F & (F & T)', async () => testCase('and', false, false, true));
      it('(F & T) & F <=> F & (T & F)', async () => testCase('and', false, true, false));
      it('(F & T) & T <=> F & (T & T)', async () => testCase('and', false, true, true));
      it('(T & F) & F <=> T & (F & F)', async () => testCase('and', true, false, false));
      it('(T & F) & T <=> T & (F & T)', async () => testCase('and', true, false, true));
      it('(T & T) & F <=> T & (T & F)', async () => testCase('and', true, true, false));
      it('(T & T) & T <=> T & (T & T)', async () => testCase('and', true, true, true));
    });

    describe('(A | B) | C <=> A | (B | C)', async () => {
      it('(F | F) | F <=> F | (F | F)', async () => testCase('or', false, false, false));
      it('(F | F) | T <=> F | (F | T)', async () => testCase('or', false, false, true));
      it('(F | T) | F <=> F | (T | F)', async () => testCase('or', false, true, false));
      it('(F | T) | T <=> F | (T | T)', async () => testCase('or', false, true, true));
      it('(T | F) | F <=> T | (F | F)', async () => testCase('or', true, false, false));
      it('(T | F) | T <=> T | (F | T)', async () => testCase('or', true, false, true));
      it('(T | T) | F <=> T | (T | F)', async () => testCase('or', true, true, false));
      it('(T | T) | T <=> T | (T | T)', async () => testCase('or', true, true, true));
    });

    describe('(A xor B) xor C <=> A xor (B xor C)', async () => {
      it('(F xor F) xor F <=> F xor (F xor F)', async () => testCase('xor', false, false, false));
      it('(F xor F) xor T <=> F xor (F xor T)', async () => testCase('xor', false, false, true));
      it('(F xor T) xor F <=> F xor (T xor F)', async () => testCase('xor', false, true, false));
      it('(F xor T) xor T <=> F xor (T xor T)', async () => testCase('xor', false, true, true));
      it('(T xor F) xor F <=> T xor (F xor F)', async () => testCase('xor', true, false, false));
      it('(T xor F) xor T <=> T xor (F xor T)', async () => testCase('xor', true, false, true));
      it('(T xor T) xor F <=> T xor (T xor F)', async () => testCase('xor', true, true, false));
      it('(T xor T) xor T <=> T xor (T xor T)', async () => testCase('xor', true, true, true));
    });
  });

  describe('Distributive law', async () => {
    async function testCase(op1: string, op2: string, a: boolean, b: boolean, c: boolean) {
      const A = a.toString();
      const B = b.toString();
      const C = c.toString();

      await app.parse(
        `
          bool ${A} ${op1} (bool ${B} ${op2} bool ${C})
          ==
          (bool ${A} ${op1} bool ${B}) ${op2} (bool ${A} ${op1} bool ${C})
        `
      );
      await app.execute();

      await checkStack(StackValue, stack, 1, 1);
    }

    describe('A & (B | C) <=> (A & B) | (A & C)', async () => {
      it('F & (F | F) <=> (F & F) | (F & F)', async () =>
        testCase('and', 'or', false, false, false));
      it('F & (F | T) <=> (F & F) | (F & T)', async () =>
        testCase('and', 'or', false, false, true));
      it('F & (T | F) <=> (F & T) | (F & F)', async () =>
        testCase('and', 'or', false, true, false));
      it('F & (T | T) <=> (F & T) | (F & T)', async () => testCase('and', 'or', false, true, true));
      it('T & (F | F) <=> (T & F) | (T & F)', async () =>
        testCase('and', 'or', true, false, false));
      it('T & (F | T) <=> (T & F) | (T & T)', async () => testCase('and', 'or', true, false, true));
      it('T & (T | F) <=> (T & T) | (T & F)', async () => testCase('and', 'or', true, true, false));
      it('T & (T | T) <=> (T & T) | (T & T)', async () => testCase('and', 'or', true, true, true));
    });

    describe('A & (B xor C) <=> (A & B) xor (A & C)', async () => {
      it('F & (F xor F) <=> (F & F) xor (F & F)', async () =>
        testCase('and', 'xor', false, false, false));
      it('F & (F xor T) <=> (F & F) xor (F & T)', async () =>
        testCase('and', 'xor', false, false, true));
      it('F & (T xor F) <=> (F & T) xor (F & F)', async () =>
        testCase('and', 'xor', false, true, false));
      it('F & (T xor T) <=> (F & T) xor (F & T)', async () =>
        testCase('and', 'xor', false, true, true));
      it('T & (F xor F) <=> (T & F) xor (T & F)', async () =>
        testCase('and', 'xor', true, false, false));
      it('T & (F xor T) <=> (T & F) xor (T & T)', async () =>
        testCase('and', 'xor', true, false, true));
      it('T & (T xor F) <=> (T & T) xor (T & F)', async () =>
        testCase('and', 'xor', true, true, false));
      it('T & (T xor T) <=> (T & T) xor (T & T)', async () =>
        testCase('and', 'xor', true, true, true));
    });
  });

  describe("DeMorgan's Law", async () => {
    async function testCase(op1: string, op2: string, a: boolean, b: boolean) {
      const A = a.toString();
      const B = b.toString();

      await app.parse(`! (bool ${A} ${op1} bool ${B}) == ! bool ${A} ${op2} ! bool ${B}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    }

    describe('!(A | B) <=> (!A) & (!B)', async () => {
      it('!(F | F) <=> (!F) & (!F)', async () => testCase('or', 'and', false, false));
      it('!(T | F) <=> (!T) & (!F)', async () => testCase('or', 'and', true, false));
      it('!(F | T) <=> (!F) & (!T)', async () => testCase('or', 'and', false, true));
      it('!(T | T) <=> (!T) & (!T)', async () => testCase('or', 'and', true, true));
    });

    describe('!(A & B) <=> (!A) | (!B)', async () => {
      it('!(F & F) <=> (!F) | (!F)', async () => testCase('and', 'or', false, false));
      it('!(T & F) <=> (!T) | (!F)', async () => testCase('and', 'or', true, false));
      it('!(F & T) <=> (!F) | (!T)', async () => testCase('and', 'or', false, true));
      it('!(T & T) <=> (!T) | (!T)', async () => testCase('and', 'or', true, true));
    });
  });

  describe('Involution Law: !!A == A', async () => {
    it('!!F == F', async () => {
      await app.parse('! (! bool false) == bool false');
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it('!!T == T', async () => {
      await app.parse('! (! bool true) == bool true');
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe('Idempotent Law', async () => {
    describe('(A or A) == A', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} or bool ${A}) == bool ${A}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T or T) == T', async () => testCase('true'));
      it('(F or F) == F', async () => testCase('false'));
    });

    describe('(A or true) == true', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} or bool true) == bool true`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T or 1) == 1', async () => testCase('true'));
      it('(F or 1) == 1', async () => testCase('false'));
    });

    describe('(A and A) == A', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} and bool ${A}) == bool ${A}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T and T) == T', async () => testCase('true'));
      it('(F and F) == F', async () => testCase('false'));
    });

    describe('(A and true) == A', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} and bool true) == bool ${A}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T and 1) == T', async () => testCase('true'));
      it('(F and 1) == F', async () => testCase('false'));
    });

    describe('(A or !A) == true', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} or ! bool ${A}) == bool true`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T or !T) == 1', async () => testCase('true'));
      it('(F or !F) == 1', async () => testCase('false'));
    });

    describe('(A or false) == A', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} or bool false) == bool ${A}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T or 0) == T', async () => testCase('true'));
      it('(F or 0) == F', async () => testCase('false'));
    });

    describe('(A and !A) == false', async () => {
      async function testCase(A: 'true' | 'false') {
        await app.parse(`(bool ${A} and ! bool ${A}) == bool false`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      }
      it('(T and !T) == 0', async () => testCase('true'));
      it('(F and !F) == 0', async () => testCase('false'));
    });
  });
});
