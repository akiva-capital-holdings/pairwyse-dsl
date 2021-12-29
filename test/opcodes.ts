import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Opcodes__factory,
  Stack__factory,
  StackValue__factory,
  Opcodes,
  ContextMock__factory,
  ContextMock,
} from '../typechain';
import {
  testLt, testGt, testLe, testAnd, testOr,
} from './helpers/testOps';
import {
  checkStack,
  pushToStack,
  testTwoInputOneOutput,
} from './helpers/utils';
import { TestCaseUint256 } from './types';
/* eslint-enable camelcase */

describe('Opcode', () => {
  // eslint-disable-next-line camelcase
  let Context: ContextMock__factory;
  // eslint-disable-next-line camelcase
  let OpcodesCont: Opcodes__factory;
  // eslint-disable-next-line camelcase
  let Stack: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let context: ContextMock;
  let opcodes: Opcodes;

  beforeEach(async () => {
    Context = await ethers.getContractFactory('ContextMock');
    OpcodesCont = await ethers.getContractFactory('Opcodes');
    Stack = await ethers.getContractFactory('Stack');
    StackValue = await ethers.getContractFactory('StackValue');

    context = await Context.deploy();
    opcodes = await OpcodesCont.deploy(context.address);
  });

  describe('Eq', () => {
    it('uint256 equal', async () => {
      const stack = await pushToStack(StackValue, context, Stack, [500, 500]);
      expect(await stack.length()).to.equal(2);
      await opcodes.opEq();
      await checkStack(StackValue, stack, 1, 1);
    });

    it('uint256 not equal', async () => {
      const stack = await pushToStack(StackValue, context, Stack, [100, 200]);
      expect(await stack.length()).to.equal(2);
      await opcodes.opEq();
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('Lt', () => {
    describe('uint256', () => {
      testLt.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () => testTwoInputOneOutput(
          Stack,
          StackValue,
          context,
          opcodes,
          testLt.opFunc,
          testCase.value1,
          testCase.value2,
          testCase.result,
        ));
      });
    });
  });

  describe('Gt', () => {
    describe('uint256', () => {
      testGt.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () => testTwoInputOneOutput(
          Stack,
          StackValue,
          context,
          opcodes,
          testGt.opFunc,
          testCase.value1,
          testCase.value2,
          testCase.result,
        ));
      });
    });
  });

  describe('Le', () => {
    describe('uint256', () => {
      testLe.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () => testTwoInputOneOutput(
          Stack,
          StackValue,
          context,
          opcodes,
          testLe.opFunc,
          testCase.value1,
          testCase.value2,
          testCase.result,
        ));
      });
    });
  });

  describe('opSwap', () => {
    it('uint256', async () => {
      const stack = await pushToStack(StackValue, context, Stack, [200, 100]);

      // stack size is 2
      expect(await stack.length()).to.equal(2);

      await opcodes.opSwap();

      await checkStack(StackValue, stack, 2, 200);
      stack.pop();
      await checkStack(StackValue, stack, 1, 100);
    });
  });

  describe('opAnd', () => {
    describe('two values of uint256', () => {
      testAnd.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () => testTwoInputOneOutput(
          Stack,
          StackValue,
          context,
          opcodes,
          testAnd.opFunc,
          testCase.value1,
          testCase.value2,
          testCase.result,
        ));
      });
    });

    it('((1 && 5) && 7) && 0', async () => {
      const stack = await pushToStack(StackValue, context, Stack, [0, 7, 5, 1]);

      // stack size is 4
      expect(await stack.length()).to.equal(4);

      // stack.len = 3; stack.pop() = 1
      await opcodes.opAnd();
      await checkStack(StackValue, stack, 3, 1);

      // stack.len = 2; stack.pop() = 1
      await opcodes.opAnd();
      await checkStack(StackValue, stack, 2, 1);

      // stack.len = 1; stack.pop() = 0
      await opcodes.opAnd();
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opOr', () => {
    describe('two values of uint256', () => {
      testOr.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () => testTwoInputOneOutput(
          Stack,
          StackValue,
          context,
          opcodes,
          testOr.opFunc,
          testCase.value1,
          testCase.value2,
          testCase.result,
        ));
      });
    });

    it('0 || 0 || 3', async () => {
      const stack = await pushToStack(StackValue, context, Stack, [3, 0, 0]);

      expect(await stack.length()).to.equal(3);

      // stack.len = 2; stack.pop() = 1
      await opcodes.opOr();
      await checkStack(StackValue, stack, 2, 0);

      // stack.len = 1; stack.pop() = 1
      await opcodes.opOr();
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe('opNot', () => {
    it('uint256 is zero', async () => {
      const stack = await pushToStack(StackValue, context, Stack, [0]);
      expect(await stack.length()).to.equal(1);
      await opcodes.opNot();
      await checkStack(StackValue, stack, 1, 1);
    });

    describe('uint256 is non-zero', () => {
      it('1', async () => {
        const stack = await pushToStack(StackValue, context, Stack, [1]);
        expect(await stack.length()).to.equal(1);
        await opcodes.opNot();
        await checkStack(StackValue, stack, 1, 0);
      });

      it('3', async () => {
        const stack = await pushToStack(StackValue, context, Stack, [3]);
        expect(await stack.length()).to.equal(1);
        await opcodes.opNot();
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });

  describe('block', () => {
    it('blockNumber', async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      // 0x05 is NUMBER
      await context.setProgram('0x15');

      const opBlockResult = await opcodes.opBlockNumber();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.blockNumber);
    });

    it('blockChainId', async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      // 0x17 is ChainID
      await context.setProgram('0x17');

      const opBlockResult = await opcodes.opBlockChainId();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.chainId);
    });

    // Block timestamp doesn't work because Hardhat doesn't return timestamp
    it.skip('blockTimestamp', async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      // 0x16 is Timestamp
      await context.setProgram('0x16');

      const opBlockResult = await opcodes.opBlockTimestamp();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.timestamp);
    });
  });
});
