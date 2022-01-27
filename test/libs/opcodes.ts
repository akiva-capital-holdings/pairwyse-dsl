import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable camelcase */
import { Stack__factory, StackValue__factory, Context, OpcodesMock, Stack } from "../../typechain";
import { testOpLt, testOpGt, testOpLe, testOpGe, testOpAnd, testOpOr, testOpXor } from "../utils/testOps";
import { checkStack, pushToStack, testTwoInputOneOutput } from "../utils/utils";
import { TestCaseUint256 } from "../types";
/* eslint-enable camelcase */

describe("Opcodes", () => {
  // eslint-disable-next-line camelcase
  let StackCont: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let app: OpcodesMock;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;

  before(async () => {
    StackCont = await ethers.getContractFactory("Stack");
    StackValue = await ethers.getContractFactory("StackValue");

    ctx = await (await ethers.getContractFactory("Context")).deploy();
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodesLib = await (await ethers.getContractFactory("Opcodes")).deploy();
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy OpcodesMock
    app = await (
      await ethers.getContractFactory("OpcodesMock", { libraries: { Opcodes: opcodesLib.address } })
    ).deploy();

    // Deploy Parser
    const parser = await (
      await ethers.getContractFactory("Parser", {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt("Stack", stackAddr);

    // Setup
    await parser.initOpcodes(ctxAddr);
    await ctx.setAppAddress(ctx.address);
    await ctx.setOpcodesAddr(opcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  it("opLoadLocalAny", async () => {
    await ctx.setProgram("0x1a");
    await expect(app.opLoadLocalAny(ctxAddr)).to.be.revertedWith("Opcodes: mustCall call not success");
  });

  it("opLoadLocalGet", async () => {
    await ctx.setProgram("0x1a000000");
    await expect(app.opLoadLocalGet(ctxAddr, "hey()")).to.be.revertedWith("Opcodes: opLoadLocal call not success");
  });

  it("opLoadRemote", async () => {
    const ctxAddrCut = ctxAddr.substring(2);
    await ctx.setProgram(`0x1a000000${ctxAddrCut}`);
    await expect(app.opLoadRemote(ctxAddr, "hey()")).to.be.revertedWith("Opcodes: opLoadRemote call not success");
  });

  it("opLoadRemoteAny", async () => {});

  describe("opEq", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opEq(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opEq(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    it("uint256 equal", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, 500]);
      expect(await stack.length()).to.equal(2);
      await app.opEq(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("uint256 not equal", async () => {
      await pushToStack(StackValue, ctx, StackCont, [100, 200]);
      expect(await stack.length()).to.equal(2);
      await app.opEq(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("opNotEq", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opNotEq(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opNotEq(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    it("uint256 equal", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, 500]);
      expect(await stack.length()).to.equal(2);
      await app.opNotEq(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });

    it("uint256 not equal", async () => {
      await pushToStack(StackValue, ctx, StackCont, [100, 200]);
      expect(await stack.length()).to.equal(2);
      await app.opNotEq(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe("opLt", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opLt(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opLt(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("uint256", () => {
      testOpLt.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpLt.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });
  });

  describe("opGt", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opGt(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opGt(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("uint256", () => {
      testOpGt.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpGt.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });
  });

  describe("opLe", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opLe(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opLe(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("uint256", () => {
      testOpLe.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpLe.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });
  });

  describe("opGe", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opGe(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opGe(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("uint256", () => {
      testOpGe.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpGe.opFunc,
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
      await pushToStack(StackValue, ctx, StackCont, [200, 100]);

      expect(await stack.length()).to.equal(2);

      await app.opSwap(ctxAddr);

      await checkStack(StackValue, stack, 2, 200);
      stack.pop();
      await checkStack(StackValue, stack, 1, 100);
    });

    // it("string", async () => {
    //   await pushToStack(StackValue, ctx, StackCont, ["hey", "hello"]);

    //   expect(await stack.length()).to.equal(2);

    //   await app.opSwap(ctxAddr);

    //   await checkStack(StackValue, stack, 2, "hey");
    //   stack.pop();
    //   await checkStack(StackValue, stack, 1, "hello");
    // });
  });

  describe("opAnd", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opAnd(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opAnd(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("two values of uint256", () => {
      testOpAnd.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpAnd.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });

    it("((1 && 5) && 7) && 0", async () => {
      await pushToStack(StackValue, ctx, StackCont, [0, 7, 5, 1]);

      // stack size is 4
      expect(await stack.length()).to.equal(4);

      // stack.len = 3; stack.pop() = 1
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 3, 1);

      // stack.len = 2; stack.pop() = 1
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 2, 1);

      // stack.len = 1; stack.pop() = 0
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("opOr", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opOr(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opOr(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("two values of uint256", () => {
      testOpOr.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpOr.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });

    it("0 || 0 || 3", async () => {
      await pushToStack(StackValue, ctx, StackCont, [3, 0, 0]);

      expect(await stack.length()).to.equal(3);

      // stack.len = 2; stack.pop() = 1
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 2, 0);

      // stack.len = 1; stack.pop() = 1
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe("opXor", () => {
    it("error: type mismatch", async () => {
      await pushToStack(StackValue, ctx, StackCont, [500, "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opXor(ctxAddr)).to.be.revertedWith("Opcodes: type mismatch");
    });

    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey", "hey"]);
      expect(await stack.length()).to.equal(2);
      await expect(app.opXor(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    describe("two values of uint256", () => {
      testOpXor.testCases.forEach((testCase: TestCaseUint256) => {
        it(testCase.name, async () =>
          testTwoInputOneOutput(
            StackCont,
            StackValue,
            ctx,
            app,
            testOpXor.opFunc,
            testCase.value1,
            testCase.value2,
            testCase.result,
          ),
        );
      });
    });

    it("0 || 0 || 3", async () => {
      await pushToStack(StackValue, ctx, StackCont, [3, 0, 0]);

      expect(await stack.length()).to.equal(3);

      // stack.len = 2; stack.pop() = 1
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 2, 0);

      // stack.len = 1; stack.pop() = 1
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe("opNot", () => {
    it("error: bad type", async () => {
      await pushToStack(StackValue, ctx, StackCont, ["hey"]);
      expect(await stack.length()).to.equal(1);
      await expect(app.opNot(ctxAddr)).to.be.revertedWith("Opcodes: bad type");
    });

    it("uint256 is zero", async () => {
      await pushToStack(StackValue, ctx, StackCont, [0]);
      expect(await stack.length()).to.equal(1);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });

    describe("uint256 is non-zero", () => {
      it("1", async () => {
        await pushToStack(StackValue, ctx, StackCont, [1]);
        expect(await stack.length()).to.equal(1);
        await app.opNot(ctxAddr);
        await checkStack(StackValue, stack, 1, 0);
      });

      it("3", async () => {
        await pushToStack(StackValue, ctx, StackCont, [3]);
        expect(await stack.length()).to.equal(1);
        await app.opNot(ctxAddr);
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });

  describe("block", () => {
    it("blockNumber", async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x05 is NUMBER
      await ctx.setProgram("0x15");

      const opBlockResult = await app.opBlockNumber(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.blockNumber);
    });

    // Block timestamp doesn't work because Hardhat doesn't return timestamp
    it("blockTimestamp", async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x16 is Timestamp
      await ctx.setProgram("0x16");

      await app.opBlockTimestamp(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */,
        )
      ).timestamp;

      expect((await svResult.getUint256()).toNumber()).to.be.approximately(lastBlockTimestamp, 1000);
    });

    it("blockChainId", async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x17 is ChainID
      await ctx.setProgram("0x17");

      const opBlockResult = await app.opBlockChainId(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.chainId);
    });
  });

  it("opMsgSender", async () => {
    const [first, second] = await ethers.getSigners();

    await app.opMsgSender(ctxAddr);
    await checkStack(StackValue, stack, 1, 0);
    await stack.clear();

    await ctx.setMsgSender(first.address);
    await app.opMsgSender(ctxAddr);
    await checkStack(StackValue, stack, 1, first.address);
    await stack.clear();

    await ctx.setMsgSender(second.address);
    await app.opMsgSender(ctxAddr);
    await checkStack(StackValue, stack, 1, second.address);
  });

  it("opLoadLocalUint256", async () => {});

  it("opLoadLocalBytes32", async () => {});

  it("opLoadLocalBool", async () => {});

  it("opLoadLocalAddress", async () => {});

  it("opLoadRemoteUint256", async () => {});

  it("opLoadRemoteBytes32", async () => {});

  it("opLoadRemoteBool", async () => {});

  it("opLoadRemoteAddress", async () => {});

  it("opBool", async () => {});

  it("opUint256", async () => {});

  it("opSendEth", async () => {});

  it("opTransfer", async () => {});

  it("opTransferFrom", async () => {});

  it("opUint256Get", async () => {});

  it("putUint256ToStack", async () => {});

  it("nextBytes", async () => {});

  it("nextBytes1", async () => {});

  it("nextBranchSelector", async () => {});

  // describe("mustCall", () => {
  //   it("error: call not success", async () => {
  //     await app.mustCall(ethers.constants.AddressZero, Buffer.from("123"));
  //   });
  // });

  it("opLoadLocalGet", async () => {});

  it("opAddressGet", async () => {});

  it("opLoadLocal", async () => {});

  it("opLoadRemote", async () => {});
});
