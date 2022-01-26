import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hex4Bytes } from "./utils/utils";
import { Agreement } from "../typechain/Agreement";
import { Parser } from "../typechain/Parser";

describe.only("Agreement", () => {
  let parser: Parser;
  let agreement: Agreement;
  let alice: SignerWithAddress;
  let receiver: SignerWithAddress;
  let anybody: SignerWithAddress;

  const ONE_MONTH = 60 * 60 * 24 * 30;
  let NEXT_MONTH: number;

  before(async () => {
    [alice, receiver, anybody] = await ethers.getSigners();

    const lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */,
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();
    const opcodesLib = await (await ethers.getContractFactory("Opcodes")).deploy();
    const executorLib = await (await ethers.getContractFactory("Executor")).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory("Parser", {
      libraries: { StringUtils: stringLib.address },
    });
    parser = await ParserCont.deploy();

    // Deploy Agreement
    agreement = await (
      await ethers.getContractFactory("Agreement", { libraries: { Executor: executorLib.address } })
    ).deploy(parser.address);
  });

  it("lifecycle", async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    await agreement.setStorageUint256(hex4Bytes("LOCK_TIME"), NEXT_MONTH);

    // Top up contract
    console.log(1);
    const oneEthBN = ethers.utils.parseEther("1");
    await anybody.sendTransaction({ to: agreement.address, value: oneEthBN });

    const signatory = alice.address;
    const transaction = "sendEth RECEIVER 1000000000000000000";
    const condition = "blockTimestamp > loadLocal uint256 LOCK_TIME";

    // Update
    console.log(2);
    const txId = await agreement.callStatic.update(signatory, transaction, condition);
    await agreement.update(signatory, transaction, condition);

    /**
     * Execute
     */
    // Bad signatory
    console.log(3);
    await expect(agreement.connect(anybody).execute(txId)).to.be.revertedWith("Agreement: bad tx signatory");

    // Condition isn't satisfied
    console.log(4);
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith("Agreement: tx condition is not satisfied");

    // Execute transaction
    console.log(5);
    await ethers.provider.send("evm_increaseTime", [ONE_MONTH]);
    await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(receiver, oneEthBN);
  });
});
