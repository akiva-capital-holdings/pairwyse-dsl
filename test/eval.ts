/* eslint-disable camelcase */
import { ethers } from "hardhat";
import {
  ContextMock,
  StackValue__factory,
  Stack,
  ApplicationMock,
} from "../typechain";
import { checkStack } from "./helpers/utils";

describe("Context", () => {
  let context: ContextMock;
  let stack: Stack;
  let app: ApplicationMock;
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
    const ApplicationCont = await ethers.getContractFactory("ApplicationMock");
    app = await ApplicationCont.deploy();

    const contextAddress = await app.ctx();
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
      const evalTx = await app.eval();
      await checkStack(StackValue, stack, 1, evalTx.blockNumber || 0);
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
      await app.eval();
      await checkStack(StackValue, stack, 1, 1);
    });

    describe("opLoadLocalUint256", () => {
      it("17 > 15", async () => {
        // Set NUMBER
        const bytes32Number = hex4Bytes("NUMBER");
        await app.setStorageUint256(bytes32Number, 17);

        // Set NUMBER2
        const bytes32Number2 = hex4Bytes("NUMBER2");
        await app.setStorageUint256(bytes32Number2, 15);

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
        await context.setProgram(`0x0a${number}0a${number2}04`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 1);
      });
      it("5 <= 3", async () => {
        // Set NUMBER
        const bytes32Number = hex4Bytes("NUMBER");
        await app.setStorageUint256(bytes32Number, 5);

        // Set NUMBER2
        const bytes32Number2 = hex4Bytes("NUMBER2");
        await app.setStorageUint256(bytes32Number2, 3);

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
        await context.setProgram(`0x0a${number}0a${number2}06`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 0);
      });
      it("12 = 12", async () => {
        // Set NUMBER
        const bytes32Number = hex4Bytes("NUMBER");
        await app.setStorageUint256(bytes32Number, 12);

        // Set NUMBER2
        const bytes32Number2 = hex4Bytes("NUMBER2");
        await app.setStorageUint256(bytes32Number2, 12);

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
        await context.setProgram(`0x0a${number}0a${number2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 1);
      });
    });

    describe("opLoadLocalBytes32", () => {
      it("bytes32 are equal", async () => {
        // Set BYTES
        const bytes32Bytes = hex4Bytes("BYTES");
        await app.setStorageBytes32(
          bytes32Bytes,
          "0x1234500000000000000000000000000000000000000000000000000000000001",
        );

        // Set BYTES2
        const bytes32Bytes2 = hex4Bytes("BYTES2");
        await app.setStorageBytes32(
          bytes32Bytes2,
          "0x1234500000000000000000000000000000000000000000000000000000000001",
        );

        /**
         * The program is:
         * `
         *  opLoadLocalBytes32 BYTES
         *  opLoadLocalBytes32 BYTES2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x0c${bytes}0c${bytes2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 1);
      });
      it("bytes32 are not equal", async () => {
        // Set BYTES
        const bytes32Bytes = hex4Bytes("BYTES");
        await app.setStorageBytes32(
          bytes32Bytes,
          "0x1234500000000000000000000000000000000000000000000000000000000001",
        );

        // Set BYTES2
        const bytes32Bytes2 = hex4Bytes("BYTES2");
        await app.setStorageBytes32(
          bytes32Bytes2,
          "0x1234500000000000000000000000000000000000000000000000000000000011",
        );

        /**
         * The program is:
         * `
         *  opLoadLocalBytes32 BYTES
         *  opLoadLocalBytes32 BYTES2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x0c${bytes}0c${bytes2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 0);
      });
    });

    describe("opLoadLocalAddress", () => {
      it("addresses are equal", async () => {
        // Set ADDR
        const bytes32Bytes = hex4Bytes("ADDR");
        await app.setStorageAddress(
          bytes32Bytes,
          "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5",
        );

        // Set ADDR2
        const bytes32Bytes2 = hex4Bytes("ADDR2");
        await app.setStorageAddress(
          bytes32Bytes2,
          "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5",
        );

        /**
         * The program is:
         * `
         *  opLoadLocalAddress ADDR
         *  opLoadLocalAddress ADDR2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x10${bytes}10${bytes2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("addresses are not equal", async () => {
        // Set ADDR
        const bytes32Bytes = hex4Bytes("ADDR");
        await app.setStorageAddress(
          bytes32Bytes,
          "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5",
        );

        // Set ADDR2
        const bytes32Bytes2 = hex4Bytes("ADDR2");
        await app.setStorageAddress(
          bytes32Bytes2,
          "0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836",
        );

        /**
         * The program is:
         * `
         *  opLoadLocalAddress ADDR
         *  opLoadLocalAddress ADDR2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x10${bytes}10${bytes2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 0);
      });
    });

    describe("opLoadLocalBool", () => {
      it("true == true", async () => {
        // Set BOOL
        const bytes32Bytes = hex4Bytes("BOOL");
        await app.setStorageBool(bytes32Bytes, true);

        // Set BOOL2
        const bytes32Bytes2 = hex4Bytes("BOOL2");
        await app.setStorageBool(bytes32Bytes2, true);

        /**
         * The program is:
         * `
         *  opLoadLocalBool BOOL
         *  opLoadLocalBool BOOL2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x0e${bytes}0e${bytes2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("true && true", async () => {
        // Set BOOL
        const bytes32Bytes = hex4Bytes("BOOL");
        await app.setStorageBool(bytes32Bytes, true);

        // Set BOOL2
        const bytes32Bytes2 = hex4Bytes("BOOL2");
        await app.setStorageBool(bytes32Bytes2, true);

        /**
         * The program is:
         * `
         *  opLoadLocalBool BOOL
         *  opLoadLocalBool BOOL2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x0e${bytes}0e${bytes2}12`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("true == false", async () => {
        // Set BOOL
        const bytes32Bytes = hex4Bytes("BOOL");
        await app.setStorageBool(bytes32Bytes, true);

        // Set BOOL2
        const bytes32Bytes2 = hex4Bytes("BOOL2");
        await app.setStorageBool(bytes32Bytes2, false);

        /**
         * The program is:
         * `
         *  opLoadLocalBool BOOL
         *  opLoadLocalBool BOOL2
         *  =
         * `
         */
        const bytes = bytes32Bytes.substr(2, 8);
        const bytes2 = bytes32Bytes2.substr(2, 8);
        await context.setProgram(`0x0e${bytes}0e${bytes2}01`);
        await app.eval();
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });
});
