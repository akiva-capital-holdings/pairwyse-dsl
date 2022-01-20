import { ethers } from "hardhat";
import { expect } from "chai";
import { Context, Parser, Stack, StackValue__factory } from "../typechain";
import { Agreement } from "../typechain/Agreement";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hex4Bytes } from "./utils/utils";

describe("Agreement", () => {
  // let transactionStack: Stack;
  // let conditionStack: Stack;
  // let transactionCtx: Context;
  // let conditionCtx: Context;
  let parser: Parser;
  let agreement: Agreement;
  let alice: SignerWithAddress;
  let receiver: SignerWithAddress;
  let anybody: SignerWithAddress;
  // let StackValue: StackValue__factory;

  const NEXT_MONTH = Math.round((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
  const PREV_MONTH = Math.round((Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000);

  before(async () => {
    [alice, receiver, anybody] = await ethers.getSigners();

    // // Create StackValue Factory instance
    // StackValue = await ethers.getContractFactory("StackValue");

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory("Parser", {
      libraries: { StringUtils: stringLib.address },
    });
    parser = await ParserCont.deploy();

    // Deploy Agreement
    agreement = await (await ethers.getContractFactory("Agreement")).deploy(parser.address);

    // // Create Context instance
    // context = await ethers.getContractAt("Context", await parser.ctx());

    // // Create Stack instance
    // const StackCont = await ethers.getContractFactory("Stack");
    // const contextStackAddress = await context.stack();
    // stack = StackCont.attach(contextStackAddress);
  });

  it.only("lifecycle", async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    await agreement.setStorageUint256(hex4Bytes("LOCK_TIME"), NEXT_MONTH);

    const signatory = alice.address;
    // const transaction = "sendEth RECEIVER 1000000000000000000";
    const transaction = "uint256 123"; // Note: change to `uint256 0` to fail with "Agreement: tx fulfilment error"
    // const condition = "blockTimestamp < loadLocal uint256 LOCK_TIME";
    const condition = "uint256 5"; // Note:change to `uint256 0` to fail with "Agreement: tx condition is not satisfied"

    // Update
    await agreement.update(signatory, transaction, condition);

    // Execute
    await expect(agreement.connect(anybody).execute(1)).to.be.revertedWith("Agreement: bad tx signatory");
    await agreement.connect(alice).execute(1);
  });
});
