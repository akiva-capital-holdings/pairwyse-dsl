import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable camelcase */
import {
  ContextMock__factory,
  // Context,
  // Eval__factory,
  // Eval,
  // Context__factory,
  EvalMock__factory,
  EvalMock,
  ContextMock,
  Stack__factory,
  StackValue__factory,
} from "../typechain";

describe("Context", () => {
  // eslint-disable-next-line camelcase
  let ContextCont: ContextMock__factory;
  let context: ContextMock;
  let EvalCont: EvalMock__factory;
  let evalInstance: EvalMock;
  // eslint-disable-next-line camelcase
  let Stack: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;

  beforeEach(async () => {
    EvalCont = await ethers.getContractFactory("EvalMock");
    evalInstance = await EvalCont.deploy();

    const contextAddress = await evalInstance.ctx();

    ContextCont = await ethers.getContractFactory("ContextMock");
    context = ContextCont.attach(contextAddress);

    Stack = await ethers.getContractFactory("Stack");
    StackValue = await ethers.getContractFactory("StackValue");
  });

  describe("eval", async () => {
    it("block number", async () => {
      const contextStackAddress = await context.stack();
      const stack = Stack.attach(contextStackAddress);

      /**
       * Program is:
       * `
       *  block number
       * `
       */
      await context.setProgram("0x0805");
      const evalTx = await evalInstance.eval();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);
      expect(await svResult.getUint256()).to.equal(evalTx.blockNumber);
    });

    it("block number < block timestamp", async () => {
      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

      /**
       * Program is:
       * `
       *  block number
       *  block timestamp
       *  <
       * `
       */
      await context.setProgram("0x0805080603");
      await evalInstance.eval();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);
      expect(await svResult.getUint256()).to.equal(1);
    });

    it.only("var", async () => {
      const contextStackAddress = await context.stack();
      const stack = await Stack.attach(contextStackAddress);

      // Set NUMBER = 17
      // const bytes32Number = ethers.utils
      //   .keccak256(ethers.utils.toUtf8Bytes("NUMBER"))
      //   .slice(0, 10);
      // NUMBER = 17
      const bytes32Number =
        "0x545cbf7700000000000000000000000000000000000000000000000000000000";
      // await context.setNumber(17);
      await context.setStorageUint256(bytes32Number, 17);
      console.log((await context.getStorageUint256(bytes32Number)).toString());

      // NUMBER2 = 10
      const bytes32Number2 =
        "0x545cbf7700000000000000000000000000000000000000000000000000000000";
      // await context.setNumber(17);
      await context.setStorageUint256(bytes32Number2, 10);
      console.log((await context.getStorageUint256(bytes32Number2)).toString());

      /**
       * Program is:
       * `
       *  var NUMBER
       *  var NUMBER2
       *  >
       * `
       */
      // await context.setProgram("0x 09 545cbf77 09 b66353ab 04");
      await context.setProgram("0x09545cbf7709b66353ab04");
      await evalInstance.eval();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);
      expect(await svResult.getUint256()).to.equal(1);
    });
  });
});
