import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Context, Parser } from "../typechain";

describe("Parser", () => {
  let sender: SignerWithAddress;
  let app: Parser;
  let ctx: Context;
  let ctxAddr: string;

  before(async () => {
    [sender] = await ethers.getSigners();

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory("Parser", {
      libraries: { StringUtils: stringLib.address },
    });
    app = await ParserCont.deploy();
  });

  beforeEach(async () => {
    // Deploy & setup Context
    ctx = await (await ethers.getContractFactory("Context")).deploy();
    ctxAddr = ctx.address;
    await app.initOpcodes(ctxAddr);
    await ctx.setAppAddress(app.address);
    await ctx.setMsgSender(sender.address);
  });

  describe("parse", () => {
    it("error: delegatecall to asmSelector failed", async () => {
      await expect(app.parse(ctxAddr, "uint256")).to.be.revertedWith("delegatecall to asmSelector failed");
    });

    it("uint256 1122334433", async () => {
      await app.parse(ctxAddr, "uint256 1122334433");
      const expected = "0x1a0000000000000000000000000000000000000000000000000000000042e576e1";
      expect(await ctx.program()).to.equal(expected);
    });

    it("loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH", async () => {
      await app.parse(ctxAddr, "loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH");
      const expected = "0x1b011b7b16d41b01a75b67d703";
      expect(await ctx.program()).to.equal(expected);
    });

    it("((time > init) and (time < expiry)) or (risk != true)", async () => {
      await app.parse(
        ctxAddr,
        `
          (loadLocal uint256 TIMESTAMP > loadLocal uint256 INIT)
          and
          (loadLocal uint256 TIMESTAMP < loadLocal uint256 EXPIRY)
          or
          (loadLocal bool RISK != bool true)
          `,
      );
      const expected = "0x1b011b7b16d41b01b687035e041b011b7b16d41b019dc69bb503121b0255248f7c18011413";
      expect(await ctx.program()).to.equal(expected);
    });

    it("should throw at unknownExpr", async () => {
      await expect(app.parse(ctxAddr, "unknownExpr")).to.be.revertedWith("Parser: 'unknownExpr' command is unknown");
      await expect(app.parse(ctxAddr, "?!")).to.be.revertedWith("Parser: '?!' command is unknown");
    });
  });
});
