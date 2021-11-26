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

  /**
   * Apply keccak256 to `str`, cut the result to the first 4 bytes, append
   * 28 bytes (32b - 4b) of zeros
   * @param str Input string
   * @returns bytes4(keccak256(str))
   */
  const hex4Bytes = (str: string) =>
    ethers.utils
      .keccak256(ethers.utils.toUtf8Bytes(str))
      .split("")
      .map((x, i) => (i < 10 ? x : "0"))
      .join("");

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
      const stack = Stack.attach(contextStackAddress);

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
      const stack = Stack.attach(contextStackAddress);

      // Set NUMBER = 17
      const bytes32Number = hex4Bytes("NUMBER");
      await context.setStorageUint256(bytes32Number, 17);
      console.log((await context.getStorageUint256(bytes32Number)).toString());

      // Set NUMBER2 = 10
      const bytes32Number2 = hex4Bytes("NUMBER2");
      await context.setStorageUint256(bytes32Number2, 16);
      console.log((await context.getStorageUint256(bytes32Number2)).toString());

      /**
       * The program is:
       * `
       *  var NUMBER
       *  var NUMBER2
       *  >
       * `
       */
      const number = bytes32Number.substr(2, 8);
      const number2 = bytes32Number2.substr(2, 8);
      await context.setProgram(
        `0x 09 ${number} 09 ${number2} 04`.split(" ").join(""),
      );
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
