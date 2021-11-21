import { expect } from "chai";
import { ethers } from "hardhat";
import { StackType } from "../src/interfaces";
// eslint-disable-next-line camelcase
import { StackValue, StackValue__factory } from "../typechain";

describe("Stack", () => {
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let stackValue: StackValue;

  beforeEach(async () => {
    StackValue = await ethers.getContractFactory("StackValue");
    stackValue = await StackValue.deploy();
  });

  describe("ArgType", () => {
    it("Uint256", async function () {
      await stackValue.setUint256(100);
      expect(await stackValue.getType()).to.equal(StackType.UINT256);
    });
  });

  describe("Uint256", () => {
    it("get/set Uint256", async () => {
      await stackValue.setUint256(100);
      expect(await stackValue.getUint256()).to.equal(100);
    });
  });
});
