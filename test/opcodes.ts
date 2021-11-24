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
import { testLt, testGt, testLe, testAnd, testOr } from "./helpers/testOps";
import {
  checkStack,
  pushToStack,
  testTwoInputOneOutput,
} from "./helpers/utils";
import { TestCaseUint256 } from "./types";
/* eslint-enable camelcase */

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
            testCase.result,
          ),
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
            testCase.result,
          ),
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
            testCase.result,
          ),
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
            testCase.result,
          ),
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

  describe("opOr", () => {
    describe("two values of uint256", () => {
      testOr.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            Stack,
            StackValue,
            context,
            opcodes,
            testOr.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });

    it.skip("((1 && 1) && 1) && 0", async () => {
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
