import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable camelcase */
import {
  // Context__factory,
  // Context,
  Opcodes__factory,
  Stack__factory,
  StackValue__factory,
  Opcodes,
  ContextMock__factory,
  ContextMock,
} from "../typechain";
import { checkStack, pushToStack, testTwoInputOneOutput } from "./utils";
import { TestCaseUint256, TestOp } from './types';
/* eslint-enable camelcase */

const testLt: TestOp = {
  opFunc: (opcodes: Opcodes) => opcodes.opLt,
  testCases: [
    // 1 < 2 = true
    { name: "a less than b", value1: 1, value2: 2, result: 1 },
    // 1 < 1 = false
    { name: "a the same as b", value1: 1, value2: 1, result: 0 },
    // 2 < 1 = false
    { name: "a greater than b", value1: 2, value2: 1, result: 0 },
  ],
};

const testGt: TestOp = {
  opFunc: (opcodes: Opcodes) => opcodes.opGt,
  testCases: [
    // 2 > 1 = true
    { name: "a greater than b", value1: 2, value2: 1, result: 1 },
    // 1 > 1 = false
    { name: "a the same as b", value1: 1, value2: 1, result: 0 },
    // 1 > 2 = false
    { name: "a less than b", value1: 1, value2: 2, result: 0 },
  ],
};

const testLe: TestOp = {
  opFunc: (opcodes: Opcodes) => opcodes.opLe,
  testCases: [
    // 1 < 2 = true
    { name: "a less than b", value1: 1, value2: 2, result: 1 },
    // 1 <= 1 = true
    { name: "a the same as b", value1: 1, value2: 1, result: 1 },
    // 2 < 1 = false
    { name: "a greater than b", value1: 2, value2: 1, result: 0 },
  ],
};

const testAnd: TestOp = {
  opFunc: (opcodes: Opcodes) => opcodes.opAnd,
  testCases: [
    // 1 && 0 = false
    { name: "1 && 0 = false", value1: 1, value2: 0, result: 0 },
    // 1 && 1 = true
    { name: "1 && 1 = true", value1: 1, value2: 1, result: 1 },
    // 0 && 1 = false
    // { name: "0 && 1 = false", value1: 0, value2: 1, result: 0 },
    // 0 && 0 = false
    { name: "0 && 0 = false", value1: 0, value2: 0, result: 0 },
    // 11 && 11 = false
    { name: "11 && 11 = false", value1: 11, value2: 11, result: 0 },
    // 3 && 3 = false
    { name: "3 && 3 = false", value1: 3, value2: 3, result: 0 },
  ],
};

describe("Opcode", () => {
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
    Context = await ethers.getContractFactory("ContextMock");
    OpcodesCont = await ethers.getContractFactory("Opcodes");
    Stack = await ethers.getContractFactory("Stack");
    StackValue = await ethers.getContractFactory("StackValue");

    context = await Context.deploy();
    opcodes = await OpcodesCont.deploy(context.address);
  });

  describe("Eq", () => {
    it("uint256 equal", async () => {
      const stack = await pushToStack(StackValue, context, Stack, [500, 500]);
      expect(await stack.length()).to.equal(2);
      await opcodes.opEq();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("uint256 not equal", async () => {
      const stack = await pushToStack(StackValue, context, Stack, [100, 200]);
      expect(await stack.length()).to.equal(2);
      await opcodes.opEq();
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("Lt", () => {
    describe("uint256", () => {
      testLt.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            Stack,
            StackValue,
            context,
            opcodes,
            testLt.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result
          )
        );
      });
    });
  });

  describe("Gt", () => {
    describe("uint256", () => {
      testGt.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            Stack,
            StackValue,
            context,
            opcodes,
            testGt.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result
          )
        );
      });
    });
  });

  describe("Le", () => {
    describe("uint256", () => {
      testLe.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            Stack,
            StackValue,
            context,
            opcodes,
            testLe.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result
          )
        );
      });
    });
  });

  describe("opSwap", () => {
    it("uint256", async () => {
      const stack = await pushToStack(StackValue, context, Stack, [200, 100]);

      // stack size is 2
      expect(await stack.length()).to.equal(2);

      await opcodes.opSwap();

      await checkStack(StackValue, stack, 2, 200);
      stack.pop();
      await checkStack(StackValue, stack, 1, 100);
    });
  });

  describe("opAnd", () => {
    describe("two values of uint256", () => {
      testAnd.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            Stack,
            StackValue,
            context,
            opcodes,
            testAnd.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result
          )
        );
      });
    });

    it("((1 && 1) && 1) && 0", async () => {
      const stack = await pushToStack(StackValue, context, Stack, [0, 1, 1, 1]);

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

  describe("opNot", () => {
    // TODO
  });

  describe("opBlock", () => {
    it("block number", async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      // 0x05 is NUMBER
      await context.setProgram("0x0005");

      const opBlockResult = await opcodes.opBlock();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.blockNumber);
    });

    it("chain id", async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      // 0x01 is ChainID
      await context.setProgram("0x0001");

      const opBlockResult = await opcodes.opBlock();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.chainId);
    });

    // Block timestamp doesn't work because Hardhat doesn't return timestamp
    it.skip("block timestamp", async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      // 0x06 is Timestamp
      await context.setProgram("0x0006");

      const opBlockResult = await opcodes.opBlock();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.timestamp);
    });
  });
});
