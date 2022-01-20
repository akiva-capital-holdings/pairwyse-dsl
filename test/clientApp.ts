// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import chai, { expect } from "chai";
// import { parseEther } from "ethers/lib/utils";
// import { ethers } from "hardhat";
// import { solidity } from "ethereum-waffle";
// import { ClientApp } from "../typechain";
// import { hex4Bytes } from "./utils/utils";

// chai.use(solidity);

// describe("Client Application", () => {
//   let app: ClientApp;
//   let user1: SignerWithAddress;

//   before(async () => {
//     [user1] = await ethers.getSigners();
//     const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();
//     const ClientAppCont = await ethers.getContractFactory("ClientApp", {
//       libraries: { StringUtils: stringLib.address },
//     });
//     app = await ClientAppCont.deploy();
//   });

//   it("Lifecycle", async () => {
//     // Top up contract
//     await user1.sendTransaction({ to: app.address, value: parseEther("1") });
//     expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther("1"));

//     // Set withdrawal condition
//     // Expression: is_risky == false && block.number > min_block
//     // Basic values: is_risky == false; min_block = block.number + 1000
//     await app.setWithdrawalCond([
//       "loadLocal",
//       "bool",
//       "IS_RISKY",
//       "bool",
//       "false",
//       "==",
//       "blockNumber",
//       "loadLocal",
//       "uint256",
//       "MIN_BLOCK",
//       ">",
//       "and",
//     ]);

//     // Can't withdraw
//     expect(await app.callStatic.withdraw()).to.equal(false);
//     await app.withdraw();
//     expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther("1"));

//     // Withdraw
//     await app.setIsRisky(false);
//     await app.setMinBlock(0);
//     expect(await app.callStatic.withdraw()).to.equal(true);
//     await expect(await app.withdraw()).to.changeEtherBalances([app, user1], [parseEther("-1"), parseEther("1")]);

//     // Top up contract
//     await user1.sendTransaction({ to: app.address, value: parseEther("1") });
//     expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther("1"));

//     // Change withdrawal condition (now only user2 can withdraw)
//     // Note: WITHDRAWALS_ALLOWED variable isn't present in the contract but it's not a problem as we're working directly
//     //       with contract's storage
//     await app.setStorageBool(hex4Bytes("WITHDRAWALS_ALLOWED"), false);
//     await app.setWithdrawalCond(["loadLocal", "bool", "WITHDRAWALS_ALLOWED"]);

//     // WITHDRAWALS_ALLOWED == false
//     expect(await app.callStatic.withdraw()).to.equal(false);
//     await app.withdraw();
//     expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther("1"));

//     // WITHDRAWALS_ALLOWED == true
//     await app.setStorageBool(hex4Bytes("WITHDRAWALS_ALLOWED"), true);
//     expect(await app.callStatic.withdraw()).to.equal(true);
//     await expect(await app.withdraw()).to.changeEtherBalances([app, user1], [parseEther("-1"), parseEther("1")]);
//   });
// });
