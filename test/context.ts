import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable camelcase */
import { ContextMock__factory, ContextMock } from "../typechain";

describe("Context", () => {
  // eslint-disable-next-line camelcase
  let Context: ContextMock__factory;
  let context: ContextMock;

  beforeEach(async () => {
    Context = await ethers.getContractFactory("ContextMock");
    context = await Context.deploy();
  });

  describe("programAt", async () => {
    it("get slice", async () => {
      await context.setProgram("0x01020304");

      expect(await context.programAt(0), "Wrong bytes slice").to.equal("0x01");
      expect(await context.programAt(1), "Wrong bytes slice").to.equal("0x02");
      expect(await context.programAt(2), "Wrong bytes slice").to.equal("0x03");
      expect(await context.programAt(3), "Wrong bytes slice").to.equal("0x04");
    });
    it("index overflow", async () => {
      await context.setProgram("0x01020304");

      await expect(context.programAt(4)).to.be.revertedWith(
        "payload index overflow"
      );
    });
  });
});
