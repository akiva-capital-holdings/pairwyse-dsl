// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { Contract } from "ethers";
// /* eslint-disable camelcase */
// import { Stack__factory, StackValue__factory, Context } from "../typechain";
// import { testLt, testGt, testLe, testAnd, testOr } from "./utils/testOps";
// import { checkStack, pushToStack, testTwoInputOneOutput } from "./utils/utils";
// import { TestCaseUint256 } from "./types";
// import { Opcodes } from "../typechain/Opcodes";
// /* eslint-enable camelcase */

// describe("Opcodes", () => {
//   // eslint-disable-next-line camelcase
//   let Stack: Stack__factory;
//   // eslint-disable-next-line camelcase
//   let StackValue: StackValue__factory;
//   let context: Context;
//   let opcodesLib: Opcodes;
//   let ctx: string;

//   beforeEach(async () => {
//     Stack = await ethers.getContractFactory("Stack");
//     StackValue = await ethers.getContractFactory("StackValue");

//     context = await (await ethers.getContractFactory("Context")).deploy();
//     ctx = context.address;

//     // Deploy libraries
//     opcodesLib = (await (await ethers.getContractFactory("Opcodes")).deploy()) as Opcodes;
//     const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

//     const parser = await (
//       await ethers.getContractFactory("Parser", {
//         libraries: { StringUtils: stringLib.address },
//       })
//     ).deploy();

//     const [sender] = await ethers.getSigners();
//     await parser.initOpcodes(ctx);
//     await context.setAppAddress(context.address);
//     await context.setMsgSender(sender.address);
//     await context.setOpcodesAddr(opcodesLib.address);
//   });

//   describe("Eq", () => {
//     it("error: type mismatch", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [500, "hey"]);
//       expect(await stack.length()).to.equal(2);
//       await expect(opcodesLib.opEq(ctx)).to.be.revertedWith("Opcodes: type mismatch");
//     });

//     it("uint256 equal", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [500, 500]);
//       expect(await stack.length()).to.equal(2);
//       await opcodesLib.opEq(ctx);
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it("uint256 not equal", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [100, 200]);
//       expect(await stack.length()).to.equal(2);
//       await opcodesLib.opEq(ctx);
//       await checkStack(StackValue, stack, 1, 0);
//     });
//   });

//   describe("Lt", () => {
//     describe("uint256", () => {
//       testLt.testCases.forEach((testCase: TestCaseUint256) => {
//         it(testCase.name, async () =>
//           testTwoInputOneOutput(
//             Stack,
//             StackValue,
//             context,
//             opcodesLib,
//             testLt.opFunc,
//             testCase.value1,
//             testCase.value2,
//             testCase.result,
//           ),
//         );
//       });
//     });
//   });

//   describe("Gt", () => {
//     describe("uint256", () => {
//       testGt.testCases.forEach((testCase: TestCaseUint256) => {
//         it(testCase.name, async () =>
//           testTwoInputOneOutput(
//             Stack,
//             StackValue,
//             context,
//             opcodesLib,
//             testGt.opFunc,
//             testCase.value1,
//             testCase.value2,
//             testCase.result,
//           ),
//         );
//       });
//     });
//   });

//   describe("Le", () => {
//     describe("uint256", () => {
//       testLe.testCases.forEach((testCase: TestCaseUint256) => {
//         it(testCase.name, async () =>
//           testTwoInputOneOutput(
//             Stack,
//             StackValue,
//             context,
//             opcodesLib,
//             testLe.opFunc,
//             testCase.value1,
//             testCase.value2,
//             testCase.result,
//           ),
//         );
//       });
//     });
//   });

//   describe("opSwap", () => {
//     it("uint256", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [200, 100]);

//       // stack size is 2
//       expect(await stack.length()).to.equal(2);

//       await opcodesLib.opSwap(ctx);

//       await checkStack(StackValue, stack, 2, 200);
//       stack.pop();
//       await checkStack(StackValue, stack, 1, 100);
//     });
//   });

//   describe("opAnd", () => {
//     describe("two values of uint256", () => {
//       testAnd.testCases.forEach((testCase: TestCaseUint256) => {
//         it(testCase.name, async () =>
//           testTwoInputOneOutput(
//             Stack,
//             StackValue,
//             context,
//             opcodesLib,
//             testAnd.opFunc,
//             testCase.value1,
//             testCase.value2,
//             testCase.result,
//           ),
//         );
//       });
//     });

//     it("((1 && 5) && 7) && 0", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [0, 7, 5, 1]);

//       // stack size is 4
//       expect(await stack.length()).to.equal(4);

//       // stack.len = 3; stack.pop() = 1
//       await opcodesLib.opAnd(ctx);
//       await checkStack(StackValue, stack, 3, 1);

//       // stack.len = 2; stack.pop() = 1
//       await opcodesLib.opAnd(ctx);
//       await checkStack(StackValue, stack, 2, 1);

//       // stack.len = 1; stack.pop() = 0
//       await opcodesLib.opAnd(ctx);
//       await checkStack(StackValue, stack, 1, 0);
//     });
//   });

//   describe("opOr", () => {
//     describe("two values of uint256", () => {
//       testOr.testCases.forEach((testCase: TestCaseUint256) => {
//         it(testCase.name, async () =>
//           testTwoInputOneOutput(
//             Stack,
//             StackValue,
//             context,
//             opcodesLib,
//             testOr.opFunc,
//             testCase.value1,
//             testCase.value2,
//             testCase.result,
//           ),
//         );
//       });
//     });

//     it("0 || 0 || 3", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [3, 0, 0]);

//       expect(await stack.length()).to.equal(3);

//       // stack.len = 2; stack.pop() = 1
//       await opcodesLib.opOr(ctx);
//       await checkStack(StackValue, stack, 2, 0);

//       // stack.len = 1; stack.pop() = 1
//       await opcodesLib.opOr(ctx);
//       await checkStack(StackValue, stack, 1, 1);
//     });
//   });

//   describe("opNot", () => {
//     it("uint256 is zero", async () => {
//       const stack = await pushToStack(StackValue, context, Stack, [0]);
//       expect(await stack.length()).to.equal(1);
//       await opcodesLib.opNot(ctx);
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     describe("uint256 is non-zero", () => {
//       it("1", async () => {
//         const stack = await pushToStack(StackValue, context, Stack, [1]);
//         expect(await stack.length()).to.equal(1);
//         await opcodesLib.opNot(ctx);
//         await checkStack(StackValue, stack, 1, 0);
//       });

//       it("3", async () => {
//         const stack = await pushToStack(StackValue, context, Stack, [3]);
//         expect(await stack.length()).to.equal(1);
//         await opcodesLib.opNot(ctx);
//         await checkStack(StackValue, stack, 1, 0);
//       });
//     });
//   });

//   describe("block", () => {
//     it("blockNumber", async () => {
//       const contextStackAddress = await context.stack();
//       const stack = Stack.attach(contextStackAddress);

//       // 0x05 is NUMBER
//       await context.setProgram("0x15");

//       const opBlockResult = await opcodesLib.opBlockNumber(ctx);

//       // stack size is 1
//       expect(await stack.length()).to.equal(1);

//       // get result
//       const svResultAddress = await stack.stack(0);
//       const svResult = StackValue.attach(svResultAddress);

//       expect(await svResult.getUint256()).to.equal(opBlockResult.blockNumber);
//     });

//     it("blockChainId", async () => {
//       const contextStackAddress = await context.stack();
//       const stack = Stack.attach(contextStackAddress);

//       // 0x17 is ChainID
//       await context.setProgram("0x17");

//       const opBlockResult = await opcodesLib.opBlockChainId(ctx);

//       // stack size is 1
//       expect(await stack.length()).to.equal(1);

//       // get result
//       const svResultAddress = await stack.stack(0);
//       const svResult = StackValue.attach(svResultAddress);

//       expect(await svResult.getUint256()).to.equal(opBlockResult.chainId);
//     });

//     // Block timestamp doesn't work because Hardhat doesn't return timestamp
//     it.skip("blockTimestamp", async () => {
//       const contextStackAddress = await context.stack();
//       const stack = Stack.attach(contextStackAddress);

//       // 0x16 is Timestamp
//       await context.setProgram("0x16");

//       const opBlockResult = await opcodesLib.opBlockTimestamp(ctx);

//       // stack size is 1
//       expect(await stack.length()).to.equal(1);

//       // get result
//       const svResultAddress = await stack.stack(0);
//       const svResult = StackValue.attach(svResultAddress);

//       expect(await svResult.getUint256()).to.equal(opBlockResult.timestamp);
//     });
//   });
// });
