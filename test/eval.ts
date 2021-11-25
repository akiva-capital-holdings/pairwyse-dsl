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

describe.only("Context", () => {
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

      /**
       * Program is:
       * `
       *  block number
       *  block timestamp
       *  <
       * `
       */
      await context.setProgram("0x0805090000000603");
      await evalInstance.eval();

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);
      expect(await svResult.getUint256()).to.equal(1);
    });
  });

  // it.only("...", async () => {
  //   const contextStackAddress = await context.stack();
  //   const stack = Stack.attach(contextStackAddress);

  //   /**
  //    * Program is:
  //    * `
  //    *  block number
  //    *  100
  //    *  >
  //    * `
  //    */
  //   await context.setProgram("0x0000000800000005000000080000000600000003");
  //   await evalInstance.eval();

  //   // stack size is 1
  //   expect(await stack.length()).to.equal(1);

  //   // get result
  //   const svResultAddress = await stack.stack(0);
  //   const svResult = StackValue.attach(svResultAddress);
  //   expect(await svResult.getUint256()).to.equal(1);
  // });
});
