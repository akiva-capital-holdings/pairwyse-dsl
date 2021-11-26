import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable camelcase */
import {
  EvalMock,
  ContextMock,
  StackValue__factory,
  Storage,
  Stack,
} from "../typechain";

describe("Context", () => {
  // eslint-disable-next-line camelcase
  let context: ContextMock;
  let storage: Storage;
  let evalInstance: EvalMock;
  let stack: Stack;
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
    const EvalCont = await ethers.getContractFactory("EvalMock");
    evalInstance = await EvalCont.deploy();

    const StorageCont = await ethers.getContractFactory("Storage");
    storage = await StorageCont.deploy();

    const contextAddress = await evalInstance.ctx();
    const ContextCont = await ethers.getContractFactory("ContextMock");
    context = ContextCont.attach(contextAddress);

    const StackCont = await ethers.getContractFactory("Stack");
    const contextStackAddress = await context.stack();
    stack = StackCont.attach(contextStackAddress);

    StackValue = await ethers.getContractFactory("StackValue");
  });

  describe("eval", async () => {
    it("block number", async () => {
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

    it("var", async () => {
      // Set NUMBER = 17
      const bytes32Number = hex4Bytes("NUMBER");
      await storage.setStorageUint256(bytes32Number, 17);

      // Set NUMBER2 = 10
      const bytes32Number2 = hex4Bytes("NUMBER2");
      await storage.setStorageUint256(bytes32Number2, 16);

      // Set storage contract address inside OpCodes
      const opCodesAddr = await evalInstance.opcodes();
      const opCodes = await ethers.getContractAt("Opcodes", opCodesAddr);
      await opCodes.setStorage(storage.address);

      /**
       * The program is:
       * `
       *  loadLocalUint256 NUMBER
       *  loadLocalUint256 NUMBER2
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
