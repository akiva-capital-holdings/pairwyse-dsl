// import { expect } from 'chai';
// import { ethers } from 'hardhat';
// /* eslint-disable camelcase */
// import { Contract } from 'ethers';
// import {
//   Stack__factory,
//   StackValue__factory,
//   Context,
//   Stack,
//   ComparatorOpcodesMock,
// } from '../../../typechain';
// import {
//   testOpLt,
//   testOpGt,
//   testOpLe,
//   testOpGe,
//   testOpAnd,
//   testOpOr,
//   testOpXor,
// } from '../../utils/testOps';
// import { checkStack, pushToStack, testTwoInputOneOutput } from '../../utils/utils';
// import { TestCaseUint256 } from '../../types';
// /* eslint-enable camelcase */

// describe('Comparator opcodes', () => {
//   // eslint-disable-next-line camelcase
//   let StackCont: Stack__factory;
//   // eslint-disable-next-line camelcase
//   let StackValue: StackValue__factory;
//   let app: ComparatorOpcodesMock;
//   let ctx: Context;
//   let ctxAddr: string;
//   let stack: Stack;

//   before(async () => {
//     StackCont = await ethers.getContractFactory('Stack');
//     StackValue = await ethers.getContractFactory('StackValue');

//     ctx = await (await ethers.getContractFactory('Context')).deploy();
//     ctxAddr = ctx.address;

//     // Deploy libraries
//     const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
//     const otherOpcodesLib = await (
//       await ethers.getContractFactory('OtherOpcodes', {
//         libraries: { OpcodeHelpers: opcodeHelpersLib.address },
//       })
//     ).deploy();
//     const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();

//     // Deploy ComparatorOpcodesMock
//     app = await (
//       await ethers.getContractFactory('ComparatorOpcodesMock', {
//         libraries: { OtherOpcodes: otherOpcodesLib.address },
//       })
//     ).deploy();

//     // Deploy Parser
//     const parser = await (
//       await ethers.getContractFactory('Parser', {
//         libraries: { StringUtils: stringLib.address },
//       })
//     ).deploy();

//     // Create Stack instance
//     const stackAddr = await ctx.stack();
//     stack = await ethers.getContractAt('Stack', stackAddr);

//     // Setup
//     await parser.initOpcodes(ctxAddr);
//     await ctx.setAppAddress(ctx.address);
//     await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);
//   });

//   afterEach(async () => {
//     await ctx.setPc(0);
//     await stack.clear();
//   });

//   it('opLoadLocalAny', async () => {
//     await ctx.setProgram('0x1a');
//     await expect(app.opLoadLocalAny(ctxAddr)).to.be.revertedWith(
//       'Opcodes: mustCall call not success'
//     );
//   });

//   it('opLoadLocalGet', async () => {
//     await ctx.setProgram('0x1a000000');
//     await expect(app.opLoadLocalGet(ctxAddr, 'hey()')).to.be.revertedWith(
//       'Opcodes: opLoadLocal call not success'
//     );
//   });

//   it('opLoadRemote', async () => {
//     const ctxAddrCut = ctxAddr.substring(2);
//     await ctx.setProgram(`0x1a000000${ctxAddrCut}`);
//     await expect(app.opLoadRemote(ctxAddr, 'hey()')).to.be.revertedWith(
//       'Opcodes: opLoadRemote call not success'
//     );
//   });

//   it('opLoadRemoteAny', async () => {});

//   describe('block', () => {
//     it('blockNumber', async () => {
//       const ctxStackAddress = await ctx.stack();
//       StackCont.attach(ctxStackAddress);

//       // 0x05 is NUMBER
//       await ctx.setProgram('0x15');

//       const opBlockResult = await app.opBlockNumber(ctxAddr);

//       // stack size is 1
//       expect(await stack.length()).to.equal(1);

//       // get result
//       const svResultAddress = await stack.stack(0);
//       const svResult = StackValue.attach(svResultAddress);

//       expect(await svResult.getUint256()).to.equal(opBlockResult.blockNumber);
//     });

//     // Block timestamp doesn't work because Hardhat doesn't return timestamp
//     it('blockTimestamp', async () => {
//       const ctxStackAddress = await ctx.stack();
//       StackCont.attach(ctxStackAddress);

//       // 0x16 is Timestamp
//       await ctx.setProgram('0x16');

//       await app.opBlockTimestamp(ctxAddr);

//       // stack size is 1
//       expect(await stack.length()).to.equal(1);

//       // get result
//       const svResultAddress = await stack.stack(0);
//       const svResult = StackValue.attach(svResultAddress);

//       const lastBlockTimestamp = (
//         await ethers.provider.getBlock(
//           // eslint-disable-next-line no-underscore-dangle
//           ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
//         )
//       ).timestamp;

//       expect((await svResult.getUint256()).toNumber()).to.be.approximately(
//         lastBlockTimestamp,
//         1000
//       );
//     });

//     it('blockChainId', async () => {
//       const ctxStackAddress = await ctx.stack();
//       StackCont.attach(ctxStackAddress);

//       // 0x17 is ChainID
//       await ctx.setProgram('0x17');

//       const opBlockResult = await app.opBlockChainId(ctxAddr);

//       // stack size is 1
//       expect(await stack.length()).to.equal(1);

//       // get result
//       const svResultAddress = await stack.stack(0);
//       const svResult = StackValue.attach(svResultAddress);

//       expect(await svResult.getUint256()).to.equal(opBlockResult.chainId);
//     });
//   });

//   it('opMsgSender', async () => {
//     const [first, second] = await ethers.getSigners();

//     await app.opMsgSender(ctxAddr);
//     await checkStack(StackValue, stack, 1, 0);
//     await stack.clear();

//     await ctx.setMsgSender(first.address);
//     await app.opMsgSender(ctxAddr);
//     await checkStack(StackValue, stack, 1, first.address);
//     await stack.clear();

//     await ctx.setMsgSender(second.address);
//     await app.opMsgSender(ctxAddr);
//     await checkStack(StackValue, stack, 1, second.address);
//   });

//   it('opLoadLocalUint256', async () => {});

//   it('opLoadLocalBytes32', async () => {});

//   it('opLoadLocalBool', async () => {});

//   it('opLoadLocalAddress', async () => {});

//   it('opLoadRemoteUint256', async () => {});

//   it('opLoadRemoteBytes32', async () => {});

//   it('opLoadRemoteBool', async () => {});

//   it('opLoadRemoteAddress', async () => {});

//   it('opBool', async () => {});

//   it('opUint256', async () => {});

//   it('opSendEth', async () => {});

//   it('opTransfer', async () => {});

//   it('opTransferFrom', async () => {});

//   it('opUint256Get', async () => {});

//   it('putUint256ToStack', async () => {});

//   it('nextBytes', async () => {});

//   it('nextBytes1', async () => {});

//   it('nextBranchSelector', async () => {});

//   it('opLoadLocalGet', async () => {});

//   it('opAddressGet', async () => {});

//   it('opLoadLocal', async () => {});

//   it('opLoadRemote', async () => {});
// });
