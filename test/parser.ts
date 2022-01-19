import { ethers } from "hardhat";
import { expect } from "chai";
import { AppMock, Context, Stack, StackValue__factory } from "../typechain";
import { checkStack, checkStackTail, hex4Bytes } from "./utils/utils";

const NEXT_MONTH = Math.round((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
const PREV_MONTH = Math.round((Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000);

describe("Parser", () => {
  let stack: Stack;
  let context: Context;
  let app: AppMock;
  let appAddrHex: string;
  let StackValue: StackValue__factory;

  before(async () => {
    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory("StackValue");

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy App
    const AppCont = await ethers.getContractFactory("AppMock", {
      libraries: { StringUtils: stringLib.address },
    });
    app = await AppCont.deploy();
    appAddrHex = app.address.slice(2);

    // Create Context instance
    context = await ethers.getContractAt("Context", await app.ctx());

    // Create Stack instance
    const StackCont = await ethers.getContractFactory("Stack");
    const contextStackAddress = await context.stack();
    stack = StackCont.attach(contextStackAddress);
  });

  it.only("spawn", async () => {
    await app.spawn(["uint256", "1122334433"]);

    const condTxs = await app.queryFilter(app.filters.ConditionalTx());
    const txObjAddr = condTxs[condTxs.length - 1].args.txObj;

    const txObj = await ethers.getContractAt("Eval", txObjAddr);
    await txObj.eval();

    await checkStack(StackValue, stack, 1, 1122334433);
  });

  it("uint256 1122334433", async () => {
    await app.exec(["uint256", "1122334433"]);
    await checkStack(StackValue, stack, 1, 1122334433);
  });

  it("uint256 2 uint256 3 -> 2 3", async () => {
    await app.exec(["uint256", "2", "uint256", "3"]);
    await checkStackTail(StackValue, stack, 2, [2, 3]);
  });

  it("5 == 5", async () => {
    await app.exec(["uint256", "5", "uint256", "5", "=="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 != 6", async () => {
    await app.exec(["uint256", "5", "uint256", "6", "!="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 < 6", async () => {
    await app.exec(["uint256", "5", "uint256", "6", "<"]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 < 5 = false", async () => {
    await app.exec(["uint256", "5", "uint256", "5", "<"]);
    await checkStack(StackValue, stack, 1, 0);
  });

  it("6 > 5", async () => {
    await app.exec(["uint256", "6", "uint256", "5", ">"]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 > 5 = false", async () => {
    await app.exec(["uint256", "5", "uint256", "5", ">"]);
    await checkStack(StackValue, stack, 1, 0);
  });

  it("5 <= 5", async () => {
    await app.exec(["uint256", "5", "uint256", "5", "<="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 <= 6", async () => {
    await app.exec(["uint256", "5", "uint256", "6", "<="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 >= 5", async () => {
    await app.exec(["uint256", "5", "uint256", "5", ">="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("6 >= 5", async () => {
    await app.exec(["uint256", "6", "uint256", "5", ">="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("5 6 swap -> 6 5", async () => {
    await app.exec(["uint256", "5", "uint256", "6", "swap"]);
    await checkStackTail(StackValue, stack, 2, [6, 5]);
  });

  describe("Logical AND", async () => {
    it("1 && 0 = false", async () => {
      await app.exec(["uint256", "1", "uint256", "0", "and"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("1 && 1 = true", async () => {
      await app.exec(["uint256", "1", "uint256", "1", "and"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 && 1 = false", async () => {
      await app.exec(["uint256", "0", "uint256", "1", "and"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("0 && 0 = false", async () => {
      await app.exec(["uint256", "0", "uint256", "0", "and"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("3 && 3 = false", async () => {
      await app.exec(["uint256", "3", "uint256", "3", "and"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("(((1 && 5) && 7) && 0) = 0", async () => {
      await app.exec(["uint256", "1", "uint256", "5", "and", "uint256", "7", "and", "uint256", "0", "and"]);

      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("Logical OR", async () => {
    it("1 || 0 = true", async () => {
      await app.exec(["uint256", "1", "uint256", "0", "or"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("1 || 1 = true", async () => {
      await app.exec(["uint256", "1", "uint256", "1", "or"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 || 5 = true", async () => {
      await app.exec(["uint256", "0", "uint256", "5", "or"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 || 0 = false", async () => {
      await app.exec(["uint256", "0", "uint256", "0", "or"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("3 || 3 = false", async () => {
      await app.exec(["uint256", "3", "uint256", "3", "or"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 || 0 || 3", async () => {
      await app.exec(["uint256", "0", "uint256", "0", "or", "uint256", "3", "or"]);

      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe("Logical XOR", async () => {
    it("0 xor 0 = false", async () => {
      await app.exec(["uint256", "0", "uint256", "0", "xor"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("1 xor 0 = true", async () => {
      await app.exec(["uint256", "1", "uint256", "0", "xor"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 xor 1 = true", async () => {
      await app.exec(["uint256", "0", "uint256", "1", "xor"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("1 xor 1 = false", async () => {
      await app.exec(["uint256", "1", "uint256", "1", "xor"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("5 xor 0 = true", async () => {
      await app.exec(["uint256", "5", "uint256", "0", "xor"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("0 xor 5 = true", async () => {
      await app.exec(["uint256", "0", "uint256", "5", "xor"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("5 xor 6 = false", async () => {
      await app.exec(["uint256", "5", "uint256", "6", "xor"]);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe("Logical NOT", async () => {
    it("NOT 0 = 1", async () => {
      await app.exec(["uint256", "0", "!"]);
      await checkStack(StackValue, stack, 1, 1);
    });
    it("NOT 1 = 0", async () => {
      await app.exec(["uint256", "1", "!"]);
      await checkStack(StackValue, stack, 1, 0);
    });
    it("NOT 3 = 0", async () => {
      await app.exec(["uint256", "3", "!"]);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  it("push false", async () => {
    await app.exec(["bool", "false"]);
    await checkStack(StackValue, stack, 1, 0);
  });

  it("push true", async () => {
    await app.exec(["bool", "true"]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("blockNumber", async () => {
    const tx = await app.exec(["blockNumber"]);
    await checkStack(StackValue, stack, 1, tx.blockNumber!);
  });

  it("blockTimestamp", async () => {
    await app.exec(["blockTimestamp"]);

    const block = await ethers.provider.getBlock("latest");
    await checkStack(StackValue, stack, 1, block.timestamp);
  });

  it("blockChainId", async () => {
    const tx = await app.exec(["blockChainId"]);
    await checkStack(StackValue, stack, 1, tx.chainId);
  });

  it("msgSender", async () => {
    const [sender] = await ethers.getSigners();
    await app.setStorageAddress(hex4Bytes("SENDER"), sender.address);
    await app.connect(sender).exec(["loadLocal", "address", "SENDER", "msgSender", "=="]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("sendEth", async () => {
    const [vault, receiver] = await ethers.getSigners();
    await app.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    const oneEthBN = ethers.utils.parseEther("1");

    // No ETH on the contract
    await app.exec(["sendEth", "RECEIVER", oneEthBN.toString()]);
    await checkStack(StackValue, stack, 1, 0);

    // Enough ETH on the contract
    await vault.sendTransaction({ to: app.address, value: oneEthBN });
    await expect(await app.exec(["sendEth", "RECEIVER", oneEthBN.toString()])).to.changeEtherBalance(
      receiver,
      oneEthBN
    );
    await checkStack(StackValue, stack, 1, 1);
  });

  it("transfer", async () => {
    const [, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const dai = await Token.deploy(ethers.utils.parseEther("1000"));

    const oneDAI = ethers.utils.parseEther("1");
    await dai.transfer(app.address, oneDAI);
    expect(await dai.balanceOf(app.address)).to.equal(oneDAI);

    await app.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    const DAI = dai.address.substring(2);

    await app.exec(["transfer", DAI, "RECEIVER", oneDAI.toString()]);
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("transferFrom", async () => {
    const [owner, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const dai = await Token.deploy(ethers.utils.parseEther("1000"));

    const oneDAI = ethers.utils.parseEther("1");
    const opcodesAddr = await app.opcodes();
    await dai.connect(owner).approve(opcodesAddr, oneDAI); // Note: approve not to app but to opcodes addr
    expect(await dai.allowance(owner.address, opcodesAddr)).to.equal(oneDAI);

    await app.setStorageAddress(hex4Bytes("DAI"), dai.address);
    await app.setStorageAddress(hex4Bytes("OWNER"), owner.address);
    await app.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);

    await app.exec(["transferFrom", "DAI", "OWNER", "RECEIVER", oneDAI.toString()]);
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("block number < block timestamp", async () => {
    await app.exec(["blockNumber", "blockTimestamp", "<"]);
    await checkStack(StackValue, stack, 1, 1);
  });

  describe("loadLocal", () => {
    it("loadLocal uint256 NUMBER", async () => {
      await app.setStorageUint256(hex4Bytes("NUMBER"), 777);

      await app.exec(["loadLocal", "uint256", "NUMBER"]);
      await checkStack(StackValue, stack, 1, 777);
    });

    it("loadLocal uint256 NUMBER (1000) > loadLocal uint256 NUMBER2 (15)", async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes("NUMBER");
      await app.setStorageUint256(bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes("NUMBER2");
      await app.setStorageUint256(bytes32Number2, 15);

      await app.exec(["loadLocal", "uint256", "NUMBER", "loadLocal", "uint256", "NUMBER2", ">"]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("blockTimestamp < loadLocal uint256 NEXT_MONTH", async () => {
      const bytes32Number = hex4Bytes("NEXT_MONTH");
      await app.setStorageUint256(bytes32Number, NEXT_MONTH);

      await app.exec(["blockTimestamp", "loadLocal", "uint256", "NEXT_MONTH", "<"]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadLocal bool A (false)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);

      await app.exec(["loadLocal", "bool", "A"]);
      await checkStack(StackValue, stack, 1, 0);
    });

    it("loadLocal bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.exec(["loadLocal", "bool", "B"]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadLocal bool A (false) != loadLocal bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.exec(["loadLocal", "bool", "A", "loadLocal", "bool", "B", "!="]);
      await checkStack(StackValue, stack, 1, 1);
    });

    describe("opLoadLocalAddress", () => {
      it("addresses are equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");

        await app.exec(["loadLocal", "address", "ADDR", "loadLocal", "address", "ADDR2", "=="]);
        await checkStack(StackValue, stack, 1, 1);
      });

      it("addresses are not equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836");

        await app.exec(["loadLocal", "address", "ADDR", "loadLocal", "address", "ADDR2", "=="]);
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

        await app.exec(["loadLocal", "bytes32", "BYTES", "loadLocal", "bytes32", "BYTES2", "=="]);
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

        await app.exec(["loadLocal", "bytes32", "BYTES", "loadLocal", "bytes32", "BYTES2", "=="]);
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });

  describe("loadRemote", () => {
    it("loadRemote uint256 NUMBER", async () => {
      await app.setStorageUint256(hex4Bytes("NUMBER"), 777);

      await app.exec(["loadRemote", "uint256", "NUMBER", appAddrHex]);
      await checkStack(StackValue, stack, 1, 777);
    });

    it("loadRemote uint256 NUMBER (1000) > loadRemote uint256 NUMBER2 (15)", async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes("NUMBER");
      await app.setStorageUint256(bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes("NUMBER2");
      await app.setStorageUint256(bytes32Number2, 15);

      await app.exec([
        "loadRemote",
        "uint256",
        "NUMBER",
        appAddrHex,
        "loadRemote",
        "uint256",
        "NUMBER2",
        appAddrHex,
        ">",
      ]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("blockTimestamp < loadRemote uint256 NEXT_MONTH", async () => {
      const bytes32Number = hex4Bytes("NEXT_MONTH");
      await app.setStorageUint256(bytes32Number, NEXT_MONTH);

      await app.exec(["blockTimestamp", "loadRemote", "uint256", "NEXT_MONTH", appAddrHex, "<"]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadRemote bool A (false)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);

      await app.exec(["loadRemote", "bool", "A", appAddrHex]);
      await checkStack(StackValue, stack, 1, 0);
    });

    it("loadRemote bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.exec(["loadRemote", "bool", "B", appAddrHex]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it("loadRemote bool A (false) != loadRemote bool B (true)", async () => {
      await app.setStorageBool(hex4Bytes("A"), false);
      await app.setStorageBool(hex4Bytes("B"), true);

      await app.exec(["loadRemote", "bool", "A", appAddrHex, "loadRemote", "bool", "B", appAddrHex, "!="]);
      await checkStack(StackValue, stack, 1, 1);
    });

    describe("opLoadRemoteAddress", () => {
      it("addresses are equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");

        await app.exec([
          "loadRemote",
          "address",
          "ADDR",
          appAddrHex,
          "loadRemote",
          "address",
          "ADDR2",
          appAddrHex,
          "==",
        ]);
        await checkStack(StackValue, stack, 1, 1);
      });

      it("different addresses are not equal", async () => {
        await app.setStorageAddress(hex4Bytes("ADDR"), "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5");
        await app.setStorageAddress(hex4Bytes("ADDR2"), "0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836");

        await app.exec([
          "loadRemote",
          "address",
          "ADDR",
          appAddrHex,
          "loadRemote",
          "address",
          "ADDR2",
          appAddrHex,
          "==",
        ]);
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

        await app.exec([
          "loadRemote",
          "bytes32",
          "BYTES",
          appAddrHex,
          "loadRemote",
          "bytes32",
          "BYTES2",
          appAddrHex,
          "==",
        ]);
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

        await app.exec([
          "loadRemote",
          "bytes32",
          "BYTES",
          appAddrHex,
          "loadRemote",
          "bytes32",
          "BYTES2",
          appAddrHex,
          "==",
        ]);
        await checkStack(StackValue, stack, 1, 0);
      });
    });
  });

  it("T & T == T", async () => {
    const code = ["bool", "true", "bool", "true", "and"];
    await app.exec(code);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("(T & T) | T == T", async () => {
    const code = ["bool", "true", "bool", "true", "and", "bool", "true", "or"];
    await app.exec(code);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("time > PREV_MONTH", async () => {
    await app.setStorageUint256(hex4Bytes("PREV_MONTH"), PREV_MONTH);
    await app.exec(["blockTimestamp", "loadLocal", "uint256", "PREV_MONTH", ">"]);
    await checkStack(StackValue, stack, 1, 1);
  });

  it("time < NEXT_MONTH", async () => {
    await app.setStorageUint256(hex4Bytes("NEXT_MONTH"), NEXT_MONTH);
    await app.exec(["blockTimestamp", "loadLocal", "uint256", "NEXT_MONTH", "<"]);
    await checkStack(StackValue, stack, 1, 1);
  });

  describe("((time > init) and (time < expiry)) or (risk != true)", () => {
    // (A & B) | C
    const code = [
      "blockTimestamp",
      "loadLocal",
      "uint256",
      "INIT",
      ">", // A

      "blockTimestamp",
      "loadLocal",
      "uint256",
      "EXPIRY",
      "<", // B

      "and",

      "loadLocal",
      "bool",
      "RISK",
      "bool",
      "true",
      "!=", // C

      "or",
    ];

    const ITS_RISKY = true;
    const NOT_RISKY = false;

    async function testCase(INIT: number, EXPIRY: number, RISK: boolean, target: number) {
      await app.setStorageUint256(hex4Bytes("INIT"), INIT);
      await app.setStorageUint256(hex4Bytes("EXPIRY"), EXPIRY);
      await app.setStorageBool(hex4Bytes("RISK"), RISK);

      await app.exec(code);
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

  describe("Execute high-level DSL", () => {
    it("parenthesis", async () => {
      await app.execHighLevel("(((uint256 1 or uint256 5) or uint256 7) and uint256 1)");
      await checkStack(StackValue, stack, 1, 1);
    });

    it("parenthesis matter", async () => {
      // no parenthesis
      await app.execHighLevel("uint256 1 or uint256 0 or uint256 1 and uint256 0");
      await checkStack(StackValue, stack, 1, 1);

      await app.execHighLevel("((uint256 1 or uint256 0) or uint256 1) and uint256 0");
      await checkStack(StackValue, stack, 1, 0);

      await app.execHighLevel("(uint256 1 or uint256 0) or (uint256 1 and uint256 0)");
      await checkStack(StackValue, stack, 1, 1);
    });

    it("complex expression", async () => {
      const program = `
      (((blockTimestamp >    loadLocal uint256 INIT)
        and
      (blockTimestamp <   loadLocal uint256 EXPIRY))
        or
      loadLocal bool RISK != bool true)`;

      await app.setStorageUint256(hex4Bytes("INIT"), NEXT_MONTH);
      await app.setStorageUint256(hex4Bytes("EXPIRY"), PREV_MONTH);
      await app.setStorageBool(hex4Bytes("RISK"), false);

      await app.execHighLevel(program);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe("Boolean Algebra", () => {
    describe("Commutative law", async () => {
      async function testCase(op: "and" | "or" | "xor", a: boolean, b: boolean) {
        await app.exec([
          "bool",
          a.toString(),
          "bool",
          b.toString(),
          op,

          "bool",
          b.toString(),
          "bool",
          a.toString(),
          op,

          "==",
        ]);
        await checkStack(StackValue, stack, 1, 1);
      }

      describe("A & B <=> B & A", async () => {
        it("T & F <=> F & T", async () => testCase("and", true, false));
        it("F & T <=> T & F", async () => testCase("and", false, true));
      });

      describe("A | B <=> B | A", async () => {
        it("T | F <=> F | T", async () => testCase("or", true, false));
        it("F | T <=> T | F", async () => testCase("or", false, true));
      });

      describe("A xor B <=> B xor A", async () => {
        it("T xor F <=> F xor T", async () => testCase("xor", true, false));
        it("F xor T <=> T xor F", async () => testCase("xor", false, true));
      });
    });

    describe("Associative law", async () => {
      async function testCase(op: "and" | "or" | "xor", a: boolean, b: boolean, c: boolean) {
        const A = a.toString();
        const B = b.toString();
        const C = c.toString();
        await app.exec([
          "bool",
          A,
          "bool",
          B,
          op,

          "bool",
          C,
          op,

          // <=>

          "bool",
          A,
          "bool",
          B,
          "bool",
          C,
          op,
          op,

          "==",
        ]);
        await checkStack(StackValue, stack, 1, 1);
      }

      describe("(A & B) & C <=> A & (B & C)", async () => {
        it("(F & F) & F <=> F & (F & F)", async () => testCase("and", false, false, false));
        it("(F & F) & T <=> F & (F & T)", async () => testCase("and", false, false, true));
        it("(F & T) & F <=> F & (T & F)", async () => testCase("and", false, true, false));
        it("(F & T) & T <=> F & (T & T)", async () => testCase("and", false, true, true));
        it("(T & F) & F <=> T & (F & F)", async () => testCase("and", true, false, false));
        it("(T & F) & T <=> T & (F & T)", async () => testCase("and", true, false, true));
        it("(T & T) & F <=> T & (T & F)", async () => testCase("and", true, true, false));
        it("(T & T) & T <=> T & (T & T)", async () => testCase("and", true, true, true));
      });

      describe("(A | B) | C <=> A | (B | C)", async () => {
        it("(F | F) | F <=> F | (F | F)", async () => testCase("or", false, false, false));
        it("(F | F) | T <=> F | (F | T)", async () => testCase("or", false, false, true));
        it("(F | T) | F <=> F | (T | F)", async () => testCase("or", false, true, false));
        it("(F | T) | T <=> F | (T | T)", async () => testCase("or", false, true, true));
        it("(T | F) | F <=> T | (F | F)", async () => testCase("or", true, false, false));
        it("(T | F) | T <=> T | (F | T)", async () => testCase("or", true, false, true));
        it("(T | T) | F <=> T | (T | F)", async () => testCase("or", true, true, false));
        it("(T | T) | T <=> T | (T | T)", async () => testCase("or", true, true, true));
      });

      describe("(A xor B) xor C <=> A xor (B xor C)", async () => {
        it("(F xor F) xor F <=> F xor (F xor F)", async () => testCase("xor", false, false, false));
        it("(F xor F) xor T <=> F xor (F xor T)", async () => testCase("xor", false, false, true));
        it("(F xor T) xor F <=> F xor (T xor F)", async () => testCase("xor", false, true, false));
        it("(F xor T) xor T <=> F xor (T xor T)", async () => testCase("xor", false, true, true));
        it("(T xor F) xor F <=> T xor (F xor F)", async () => testCase("xor", true, false, false));
        it("(T xor F) xor T <=> T xor (F xor T)", async () => testCase("xor", true, false, true));
        it("(T xor T) xor F <=> T xor (T xor F)", async () => testCase("xor", true, true, false));
        it("(T xor T) xor T <=> T xor (T xor T)", async () => testCase("xor", true, true, true));
      });
    });

    describe("Distributive law", async () => {
      async function testCase(op1: string, op2: string, a: boolean, b: boolean, c: boolean) {
        const A = a.toString();
        const B = b.toString();
        const C = c.toString();

        await app.exec([
          "bool",
          A,
          "bool",
          B,
          "bool",
          C,
          op2,
          op1,

          // <=>

          "bool",
          A,
          "bool",
          B,
          op1,

          "bool",
          A,
          "bool",
          C,
          op1,

          op2,
          "==",
        ]);

        await checkStack(StackValue, stack, 1, 1);
      }

      describe("A & (B | C) <=> (A & B) | (A & C)", async () => {
        it("F & (F | F) <=> (F & F) | (F & F)", async () => testCase("and", "or", false, false, false));
        it("F & (F | T) <=> (F & F) | (F & T)", async () => testCase("and", "or", false, false, true));
        it("F & (T | F) <=> (F & T) | (F & F)", async () => testCase("and", "or", false, true, false));
        it("F & (T | T) <=> (F & T) | (F & T)", async () => testCase("and", "or", false, true, true));
        it("T & (F | F) <=> (T & F) | (T & F)", async () => testCase("and", "or", true, false, false));
        it("T & (F | T) <=> (T & F) | (T & T)", async () => testCase("and", "or", true, false, true));
        it("T & (T | F) <=> (T & T) | (T & F)", async () => testCase("and", "or", true, true, false));
        it("T & (T | T) <=> (T & T) | (T & T)", async () => testCase("and", "or", true, true, true));
      });

      describe("A & (B xor C) <=> (A & B) xor (A & C)", async () => {
        it("F & (F xor F) <=> (F & F) xor (F & F)", async () => testCase("and", "xor", false, false, false));
        it("F & (F xor T) <=> (F & F) xor (F & T)", async () => testCase("and", "xor", false, false, true));
        it("F & (T xor F) <=> (F & T) xor (F & F)", async () => testCase("and", "xor", false, true, false));
        it("F & (T xor T) <=> (F & T) xor (F & T)", async () => testCase("and", "xor", false, true, true));
        it("T & (F xor F) <=> (T & F) xor (T & F)", async () => testCase("and", "xor", true, false, false));
        it("T & (F xor T) <=> (T & F) xor (T & T)", async () => testCase("and", "xor", true, false, true));
        it("T & (T xor F) <=> (T & T) xor (T & F)", async () => testCase("and", "xor", true, true, false));
        it("T & (T xor T) <=> (T & T) xor (T & T)", async () => testCase("and", "xor", true, true, true));
      });
    });

    describe("DeMorgan's Law", async () => {
      async function testCase(op1: string, op2: string, a: boolean, b: boolean) {
        const A = a.toString();
        const B = b.toString();

        await app.exec(["bool", A, "bool", B, op1, "!", "bool", A, "!", "bool", B, "!", op2, "=="]);
        await checkStack(StackValue, stack, 1, 1);
      }

      describe("!(A | B) <=> (!A) & (!B)", async () => {
        it("!(F | F) <=> (!F) & (!F)", async () => testCase("or", "and", false, false));
        it("!(T | F) <=> (!T) & (!F)", async () => testCase("or", "and", true, false));
        it("!(F | T) <=> (!F) & (!T)", async () => testCase("or", "and", false, true));
        it("!(T | T) <=> (!T) & (!T)", async () => testCase("or", "and", true, true));
      });

      describe("!(A & B) <=> (!A) | (!B)", async () => {
        it("!(F & F) <=> (!F) | (!F)", async () => testCase("and", "or", false, false));
        it("!(T & F) <=> (!T) | (!F)", async () => testCase("and", "or", true, false));
        it("!(F & T) <=> (!F) | (!T)", async () => testCase("and", "or", false, true));
        it("!(T & T) <=> (!T) | (!T)", async () => testCase("and", "or", true, true));
      });
    });

    describe("Involution Law: !!A == A", async () => {
      it("!!F == F", async () => {
        await app.exec(["bool", "false", "!", "!", "bool", "false", "=="]);
        await checkStack(StackValue, stack, 1, 1);
      });

      it("!!T == T", async () => {
        await app.exec(["bool", "true", "!", "!", "bool", "true", "=="]);
        await checkStack(StackValue, stack, 1, 1);
      });
    });

    describe("Idempotent Law", async () => {
      describe("(A or A) == A", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", A, "or", "bool", A, "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T or T) == T", async () => testCase("true"));
        it("(F or F) == F", async () => testCase("false"));
      });

      describe("(A or 1) == 1", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", "true", "or", "bool", "true", "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T or 1) == 1", async () => testCase("true"));
        it("(F or 1) == 1", async () => testCase("false"));
      });

      describe("(A and A) == A", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", A, "and", "bool", A, "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T and T) == T", async () => testCase("true"));
        it("(F and F) == F", async () => testCase("false"));
      });

      describe("(A and 1) == A", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", "true", "and", "bool", A, "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T and 1) == T", async () => testCase("true"));
        it("(F and 1) == F", async () => testCase("false"));
      });

      describe("(A or !A) == 1", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", A, "!", "or", "bool", "true", "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T or !T) == 1", async () => testCase("true"));
        it("(F or !F) == 1", async () => testCase("false"));
      });

      describe("(A or 0) == A", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", "false", "or", "bool", A, "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T or 0) == T", async () => testCase("true"));
        it("(F or 0) == F", async () => testCase("false"));
      });

      describe("(A and !A) == 0", async () => {
        async function testCase(A: "true" | "false") {
          await app.exec(["bool", A, "bool", A, "!", "and", "bool", "false", "=="]);
          await checkStack(StackValue, stack, 1, 1);
        }
        it("(T and !T) == 0", async () => testCase("true"));
        it("(F and !F) == 0", async () => testCase("false"));
      });
    });
  });

  it("should throw at unknownExpr", async () => {
    await expect(app.exec(["unknownExpr"])).to.be.revertedWith("Parser: 'unknownExpr' command is unknown");
    await expect(app.exec(["?!"])).to.be.revertedWith("Parser: '?!' command is unknown");
  });
});
