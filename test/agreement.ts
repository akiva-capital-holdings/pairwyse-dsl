import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hex4Bytes } from "./utils/utils";
import { Agreement } from "../typechain/Agreement";
import { Parser } from "../typechain/Parser";

describe("Agreement", () => {
  let parser: Parser;
  let agreement: Agreement;
  let alice: SignerWithAddress;
  let receiver: SignerWithAddress;
  let anybody: SignerWithAddress;

  const ONE_MONTH = 60 * 60 * 24 * 30;
  const NEXT_MONTH = Math.round((Date.now() + ONE_MONTH * 1000) / 1000);

  before(async () => {
    [alice, receiver, anybody] = await ethers.getSigners();

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory("Parser", {
      libraries: { StringUtils: stringLib.address },
    });
    parser = await ParserCont.deploy();

    // Deploy Agreement
    agreement = await (await ethers.getContractFactory("Agreement")).deploy(parser.address);
  });

  it.only("lifecycle", async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes("RECEIVER"), receiver.address);
    await agreement.setStorageUint256(hex4Bytes("LOCK_TIME"), NEXT_MONTH);

    // Top up contract
    const oneEthBN = ethers.utils.parseEther("1");
    await anybody.sendTransaction({ to: await agreement.parser(), value: oneEthBN });

    const signatory = alice.address;
    const transaction = "sendEth RECEIVER 1000000000000000000";
    const condition = "blockTimestamp > loadLocal uint256 LOCK_TIME";

    // Update
    await agreement.update(signatory, transaction, condition);

    /**
     * Execute
     */
    // Bad signatory
    await expect(agreement.connect(anybody).execute(1)).to.be.revertedWith("Agreement: bad tx signatory");

    // Condition isn't satisfied
    await expect(agreement.connect(alice).execute(1)).to.be.revertedWith("Agreement: tx condition is not satisfied");

    // Execute transaction
    await ethers.provider.send("evm_increaseTime", [ONE_MONTH]);
    await expect(await agreement.connect(alice).execute(1)).to.changeEtherBalance(receiver, oneEthBN);
  });
});
