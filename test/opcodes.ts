import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable camelcase */
import {
  Context__factory,
  Context,
  Opcodes__factory,
  Stack__factory,
  StackValue__factory,
  Opcodes,
  ContextMock__factory,
  ContextMock,
} from "../typechain";
import { TestCaseUint256, TestOp, testTwoInputOneOutput } from "./utils";
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

describe("Opcode", () => {
  // eslint-disable-next-line camelcase
  let Context: ContextMock__factory;
  // eslint-disable-next-line camelcase
  let Opcodes: Opcodes__factory;
  // eslint-disable-next-line camelcase
  let Stack: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let context: ContextMock;
  let opcodes: Opcodes;

  beforeEach(async () => {
    Context = await ethers.getContractFactory("ContextMock");
    Opcodes = await ethers.getContractFactory("Opcodes");
    Stack = await ethers.getContractFactory("Stack");
    StackValue = await ethers.getContractFactory("StackValue");

    context = await Context.deploy();
    opcodes = await Opcodes.deploy(context.address);
  });
  describe("Eq", () => {
    it("uint256 equal", async function () {
      const sv1 = await StackValue.deploy();
      const sv2 = await StackValue.deploy();

      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

      // empty stack
      expect(await stack.length()).to.equal(0);

      // push two values
      await sv1.setUint256(500);
      await stack.push(sv1.address);

      await sv2.setUint256(500);
      await stack.push(sv2.address);

      // stack size is 2
      expect(await stack.length()).to.equal(2);

      await opcodes.opEq();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);
      expect(await svResult.getUint256()).to.equal(1);
    });

    it("uint256 not equal", async function () {
      const sv1 = await StackValue.deploy();
      const sv2 = await StackValue.deploy();

      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

      // empty stack
      expect(await stack.length()).to.equal(0);

      // push two values
      await sv1.setUint256(100);
      await stack.push(sv1.address);

      await sv2.setUint256(200);
      await stack.push(sv2.address);

      // stack size is 2
      expect(await stack.length()).to.equal(2);

      await opcodes.opEq();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);
      expect(await svResult.getUint256()).to.equal(0);
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

  describe("opSwap", async () => {
    it("uint256", async function () {
      const sv1 = await StackValue.deploy();
      const sv2 = await StackValue.deploy();

      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

      // push two values
      await sv1.setUint256(100);
      await stack.push(sv1.address);

      await sv2.setUint256(200);
      await stack.push(sv2.address);

      // stack size is 2
      expect(await stack.length()).to.equal(2);

      await opcodes.opSwap();

      // stack size is 2
      expect(await stack.length()).to.equal(2);

      // get result
      const svResultAddress1 = await stack.stack(0);
      const svResult1 = StackValue.attach(svResultAddress1);
      expect(await svResult1.getUint256()).to.equal(200);

      const svResultAddress2 = await stack.stack(1);
      const svResult2 = StackValue.attach(svResultAddress2);
      expect(await svResult2.getUint256()).to.equal(100);
    });
  });

  describe("opBlock", async () => {
    it("block number", async function () {
      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

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
    it("chain id", async function () {
      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

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
    it.skip("block timestamp", async function () {
      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

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
