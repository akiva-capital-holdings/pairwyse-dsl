import { ethers } from "hardhat";
import { expect } from "chai";
import { App, Context, Executor, Parser, Stack, StackValue__factory } from "../../typechain";
import { checkStack, checkStackTail, hex4Bytes } from "../utils/utils";

describe("DSL: basic", () => {
  let stack: Stack;
  let ctx: Context;
  let app: App;
  let parser: Parser;
  let executor: Executor;
  let appAddrHex: string;
  let StackValue: StackValue__factory;
  let NEXT_MONTH: number;
  let PREV_MONTH: number;
  let lastBlockTimestamp: number;

  before(async () => {
    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;
    PREV_MONTH = lastBlockTimestamp - 60 * 60 * 24 * 30;

    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory("StackValue");

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory("Parser", {
      libraries: { StringUtils: stringLib.address },
    });
    parser = await ParserCont.deploy();

    // Deploy Executor
    executor = await (await ethers.getContractFactory("Executor")).deploy(await parser.opcodes());

    // Deploy Context
    ctx = await (await ethers.getContractFactory("Context")).deploy();

    // Create Stack instance
    const StackCont = await ethers.getContractFactory("Stack");
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);

    // Deploy Application
    app = await (await ethers.getContractFactory("App")).deploy(parser.address, executor.address, ctx.address);
    appAddrHex = app.address.slice(2);
  });

  it("uint256 1122334433", async () => {
    await app.parse("uint256 1122334433");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1122334433);
  });

  it("uint256 2 uint256 3 -> 2 3", async () => {
    await app.parse("uint256 2 uint256 3");
    await app.execute();
    await checkStackTail(StackValue, stack, 2, [2, 3]);
  });

  it("5 == 5", async () => {
    await app.parse("uint256 5 == uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 != 6", async () => {
    await app.parse("uint256 5 != uint256 6");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 < 6", async () => {
    await app.parse("uint256 5 < uint256 6");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 < 5 = false", async () => {
    await app.parse("uint256 5 < uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 0);
  });

  it("6 > 5", async () => {
    await app.parse("uint256 6 > uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 > 5 = false", async () => {
    await app.parse("uint256 5 > uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 0);
  });

  it("5 <= 5", async () => {
    await app.parse("uint256 5 <= uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 <= 6", async () => {
    await app.parse("uint256 5 <= uint256 6");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 >= 5", async () => {
    await app.parse("uint256 5 >= uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("6 >= 5", async () => {
    await app.parse("uint256 6 >= uint256 5");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 6 swap -> 6 5", async () => {
    await app.parse("uint256 5 swap uint256 6");
    await app.execute();
    await checkStackTail(StackValue, stack, 2, [6, 5]);
  });

  describe("Logical AND", async () => {
    it("1 && 0 = false", async () => {
      await app.parse("uint256 1 and uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("1 && 1 = true", async () => {
      await app.parse("uint256 1 and uint256 1");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 && 1 = false", async () => {
      await app.parse("uint256 0 and uint256 1");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("0 && 0 = false", async () => {
      await app.parse("uint256 0 and uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("3 && 3 = false", async () => {
      await app.parse("uint256 3 and uint256 3");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("(((1 && 5) && 7) && 0) = 0", async () => {
      await app.parse("uint256 1 and uint256 5 and uint256 7 and uint256 0");
      await app.execute();

      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("Logical OR", async () => {
    it("1 || 0 = true", async () => {
      await app.parse("uint256 1 or uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("1 || 1 = true", async () => {
      await app.parse("uint256 1 or uint256 1");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 || 5 = true", async () => {
      await app.parse("uint256 0 or uint256 5");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 || 0 = false", async () => {
      await app.parse("uint256 0 or uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("3 || 3 = false", async () => {
      await app.parse("uint256 3 or uint256 3");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 || 0 || 3", async () => {
      await app.parse("uint256 0 or uint256 0 or uint256 3");
      await app.execute();

      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe("Logical XOR", async () => {
    it("0 xor 0 = false", async () => {
      await app.parse("uint256 0 xor uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("1 xor 0 = true", async () => {
      await app.parse("uint256 1 xor uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 xor 1 = true", async () => {
      await app.parse("uint256 0 xor uint256 1");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("1 xor 1 = false", async () => {
      await app.parse("uint256 1 xor uint256 1");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("5 xor 0 = true", async () => {
      await app.parse("uint256 5 xor uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 xor 5 = true", async () => {
      await app.parse("uint256 0 xor uint256 5");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("5 xor 6 = false", async () => {
      await app.parse("uint256 5 xor uint256 6");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("Logical NOT", async () => {
    it("NOT 0 = 1", async () => {
      await app.parse("! uint256 0");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });
    it("NOT 1 = 0", async () => {
      await app.parse("! uint256 1");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
    it("NOT 3 = 0", async () => {
      await app.parse("! uint256 3");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  it("push false", async () => {
    await app.parse("bool false");
    await app.execute();
    await checkStack(StackValue, stack, 1, 0);
  });

  it("push true", async () => {
    await app.parse("bool true");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("blockNumber", async () => {
    await app.parse("blockNumber");
    const tx = await app.execute();
    await checkStack(StackValue, stack, 1, tx.blockNumber!);
  });

  it("blockTimestamp", async () => {
    await app.parse("blockTimestamp");
    await app.execute();
    const block = await ethers.provider.getBlock("latest");
    await checkStack(StackValue, stack, 1, block.timestamp);
  });

  it("blockChainId", async () => {
    await app.parse("blockChainId");
    const tx = await app.execute();
    await checkStack(StackValue, stack, 1, tx.chainId);
  });

  describe("loadLocal", () => {
    it("loadLocal uint256 NUMBER", async () => {
      await app.setStorageUint256(hex4Bytes("NUMBER"), 777);
      await app.parse("loadLocal uint256 NUMBER");
      await app.execute();
      await checkStack(StackValue, stack, 1, 777);
    });

    it("loadLocal uint256 NUMBER (1000) > loadLocal uint256 NUMBER2 (15)", async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes("NUMBER");
      await app.setStorageUint256(bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes("NUMBER2");
      await app.setStorageUint256(bytes32Number2, 15);

      await app.parse("loadLocal uint256 NUMBER > loadLocal uint256 NUMBER2");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH", async () => {
      await app.setStorageUint256(hex4Bytes("NEXT_MONTH"), NEXT_MONTH);
      await app.setStorageUint256(hex4Bytes("TIMESTAMP"), lastBlockTimestamp);

      await app.parse("loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadLocal bool A (false)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);

      await app.parse("loadLocal bool A");
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });

    it("loadLocal bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.parse("loadLocal bool B");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadLocal bool A (false) != loadLocal bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.parse("loadLocal bool A != loadLocal bool B");
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    describe("opLoadLocalAddress", () => {
      it("addresses are equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");

        await app.parse("loadLocal address ADDR == loadLocal address ADDR2");
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("addresses are not equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836");

        await app.parse("loadLocal address ADDR == loadLocal address ADDR2");
        await app.execute();
        await checkStack(StackValue, stack, 1, 0);
      });
    });

    describe("opLoadLocalBytes32", () => {
      it("bytes32 are equal", async () => {
        await app.setStorageBytes32(
          hex4Bytes("BYTES"),
          "0x1234500000000000000000000000000000000000000000000000000000000001"
        );
        await app.setStorageBytes32(
          hex4Bytes("BYTES2"),
          "0x1234500000000000000000000000000000000000000000000000000000000001"
        );

        await app.parse("loadLocal bytes32 BYTES == loadLocal bytes32 BYTES2");
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("bytes32 are not equal", async () => {
        await app.setStorageBytes32(
          hex4Bytes("BYTES"),
          "0x1234500000000000000000000000000000000000000000000000000000000001"
        );
        await app.setStorageBytes32(
          hex4Bytes("BYTES2"),
          "0x1234500000000000000000000000000000000000000000000000000000000011"
        );

        await app.parse("loadLocal bytes32 BYTES == loadLocal bytes32 BYTES2");
        await app.execute();
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });

  describe("loadRemote", () => {
    it("loadRemote uint256 NUMBER", async () => {
      await app.setStorageUint256(hex4Bytes("NUMBER"), 777);

      await app.parse(`loadRemote uint256 NUMBER ${appAddrHex}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 777);
    });

    it("loadRemote uint256 NUMBER (1000) > loadRemote uint256 NUMBER2 (15)", async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes("NUMBER");
      await app.setStorageUint256(bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes("NUMBER2");
      await app.setStorageUint256(bytes32Number2, 15);

      await app.parse(`loadRemote uint256 NUMBER ${appAddrHex} > loadRemote uint256 NUMBER2 ${appAddrHex}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadLocal uint256 TIMESTAMP < loadRemote uint256 NEXT_MONTH", async () => {
      await app.setStorageUint256(hex4Bytes("NEXT_MONTH"), NEXT_MONTH);
      await app.setStorageUint256(hex4Bytes("TIMESTAMP"), lastBlockTimestamp);

      await app.parse(`loadLocal uint256 TIMESTAMP < loadRemote uint256 NEXT_MONTH ${appAddrHex}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadRemote bool A (false)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);

      await app.parse(`loadRemote bool A ${appAddrHex}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 0);
    });

    it("loadRemote bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.parse(`loadRemote bool B ${appAddrHex}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadRemote bool A (false) != loadRemote bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.parse(`loadRemote bool A ${appAddrHex} != loadRemote bool B ${appAddrHex}`);
      await app.execute();
      await checkStack(StackValue, stack, 1, 1);
    });

    describe("opLoadRemoteAddress", () => {
      it("addresses are equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");

        await app.parse(`loadRemote address ADDR ${appAddrHex} == loadRemote address ADDR2 ${appAddrHex}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("different addresses are not equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836");

        await app.parse(`loadRemote address ADDR ${appAddrHex} == loadRemote address ADDR2 ${appAddrHex}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 0);
      });
    });

    describe("opLoadRemoteBytes32", () => {
      it("bytes32 are equal", async () => {
        await app.setStorageBytes32(
          hex4Bytes("BYTES"),
          "0x1234500000000000000000000000000000000000000000000000000000000001"
        );
        await app.setStorageBytes32(
          hex4Bytes("BYTES2"),
          "0x1234500000000000000000000000000000000000000000000000000000000001"
        );

        await app.parse(`loadRemote bytes32 BYTES ${appAddrHex} == loadRemote bytes32 BYTES2 ${appAddrHex}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 1);
      });

      it("bytes32 are not equal", async () => {
        await app.setStorageBytes32(
          hex4Bytes("BYTES"),
          "0x1234500000000000000000000000000000000000000000000000000000000001"
        );
        await app.setStorageBytes32(
          hex4Bytes("BYTES2"),
          "0x1234500000000000000000000000000000000000000000000000000000000011"
        );

        await app.parse(`loadRemote bytes32 BYTES ${appAddrHex} == loadRemote bytes32 BYTES2 ${appAddrHex}`);
        await app.execute();
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });

  it("msgSender", async () => {
    const [sender] = await ethers.getSigners();
    await app.setStorageAddress(hex4Bytes("SENDER"), sender.address);
    await app.parse("loadLocal address SENDER == msgSender");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("sendEth", async () => {
    const [vault, receiver] = await ethers.getSigners();
    await app.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    const oneEthBN = ethers.utils.parseEther("1");

    await app.parse(`sendEth RECEIVER ${oneEthBN.toString()}`);

    // No ETH on the contract
    await expect(app.execute()).to.be.revertedWith("Executor: call not success");

    // Enough ETH on the contract
    await vault.sendTransaction({ to: app.address, value: oneEthBN });
    await expect(await app.execute()).to.changeEtherBalance(receiver, oneEthBN);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("transfer", async () => {
    const [, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const dai = await Token.deploy(ethers.utils.parseEther("1000"));

    const oneDAI = ethers.utils.parseEther("1");
    const opcodesAddr = await parser.opcodes();
    await dai.transfer(opcodesAddr, oneDAI);
    expect(await dai.balanceOf(opcodesAddr)).to.equal(oneDAI);

    await app.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    const DAI = dai.address.substring(2);

    await app.parse(`transfer ${DAI} RECEIVER ${oneDAI.toString()}`);
    await app.execute();
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("transferFrom", async () => {
    const [owner, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const dai = await Token.deploy(ethers.utils.parseEther("1000"));

    const oneDAI = ethers.utils.parseEther("1");
    const opcodesAddr = await parser.opcodes();
    await dai.connect(owner).approve(opcodesAddr, oneDAI); // Note: approve not to app but to opcodes addr
    expect(await dai.allowance(owner.address, opcodesAddr)).to.equal(oneDAI);

    await app.setStorageAddress(hex4Bytes("DAI"), dai.address);
    await app.setStorageAddress(hex4Bytes("OWNER"), owner.address);
    await app.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);

    await app.parse(`transferFrom DAI OWNER RECEIVER ${oneDAI.toString()}`);
    await app.execute();
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("TIMESTAMP > PREV_MONTH", async () => {
    await app.setStorageUint256(hex4Bytes("PREV_MONTH"), PREV_MONTH);
    await app.setStorageUint256(hex4Bytes("TIMESTAMP"), lastBlockTimestamp);
    await app.parse("loadLocal uint256 TIMESTAMP > loadLocal uint256 PREV_MONTH");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("TIMESTAMP < NEXT_MONTH", async () => {
    await app.setStorageUint256(hex4Bytes("NEXT_MONTH"), NEXT_MONTH);
    await app.setStorageUint256(hex4Bytes("TIMESTAMP"), lastBlockTimestamp);
    await app.parse("(loadLocal uint256 TIMESTAMP) < (loadLocal uint256 NEXT_MONTH)");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  it("block number < block timestamp", async () => {
    await app.parse("blockNumber < blockTimestamp");
    await app.execute();
    await checkStack(StackValue, stack, 1, 1);
  });

  describe("((time > init) and (time < expiry)) or (risk != true)", () => {
    const ITS_RISKY = true;
    const NOT_RISKY = false;

    async function testCase(INIT: number, EXPIRY: number, RISK: boolean, target: number) {
      await app.setStorageUint256(hex4Bytes("INIT"), INIT);
      await app.setStorageUint256(hex4Bytes("EXPIRY"), EXPIRY);
      await app.setStorageUint256(hex4Bytes("TIMESTAMP"), lastBlockTimestamp);
      await app.setStorageBool(hex4Bytes("RISK"), RISK);

      await app.parse(
        `
        (loadLocal uint256 TIMESTAMP > loadLocal uint256 INIT)
        and
        (loadLocal uint256 TIMESTAMP < loadLocal uint256 EXPIRY)
        or
        (loadLocal bool RISK != bool true)
        `
      );
      await app.execute();
      await checkStack(StackValue, stack, 1, target);
    }

    // T - true, F - false
    it("((T & T) | T) == T", async () => testCase(PREV_MONTH, NEXT_MONTH, NOT_RISKY, 1));
    it("((T & F) | T) == T", async () => testCase(PREV_MONTH, PREV_MONTH, NOT_RISKY, 1));
    it("((F & T) | T) == T", async () => testCase(NEXT_MONTH, NEXT_MONTH, NOT_RISKY, 1));
    it("((F & F) | T) == T", async () => testCase(NEXT_MONTH, PREV_MONTH, NOT_RISKY, 1));
    it("((T & T) | F) == T", async () => testCase(PREV_MONTH, NEXT_MONTH, ITS_RISKY, 1));
    it("((T & F) | F) == F", async () => testCase(PREV_MONTH, PREV_MONTH, ITS_RISKY, 0));
    it("((F & T) | F) == F", async () => testCase(NEXT_MONTH, NEXT_MONTH, ITS_RISKY, 0));
    it("((F & F) | F) == F", async () => testCase(NEXT_MONTH, PREV_MONTH, ITS_RISKY, 0));
  });
});
