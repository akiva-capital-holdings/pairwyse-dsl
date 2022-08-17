// import { ethers } from 'hardhat';
// import { expect } from 'chai';
// import { parseEther, parseUnits } from 'ethers/lib/utils';
// import { App, Context, Stack, StackValue__factory } from '../../../typechain-types';
// import { checkStack, checkStackTail, checkStackTailv2, hex4Bytes } from '../../utils/utils';
// import { deployBase, deployOpcodeLibs } from '../../../scripts/data/deploy.utils';

// describe('DSL: basic', () => {
//   let stack: Stack;
//   let ctx: Context;
//   let app: App;
//   let appAddrHex: string;
//   let StackValue: StackValue__factory;
//   let NEXT_MONTH: number;
//   let PREV_MONTH: number;
//   let lastBlockTimestamp: number;

//   before(async () => {
//     lastBlockTimestamp = (
//       await ethers.provider.getBlock(
//         // eslint-disable-next-line no-underscore-dangle
//         ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
//       )
//     ).timestamp;

//     NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;
//     PREV_MONTH = lastBlockTimestamp - 60 * 60 * 24 * 30;

//     // Create StackValue Factory instance
//     StackValue = await ethers.getContractFactory('StackValue');

//     // Deploy libraries
//     const [
//       comparisonOpcodesLibAddr,
//       branchingOpcodesLibAddr,
//       logicalOpcodesLibAddr,
//       otherOpcodesLibAddr,
//     ] = await deployOpcodeLibs();

//     const [parserAddr, executorLibAddr, preprAddr] = await deployBase();

//     // Deploy Context & setup
//     ctx = await (await ethers.getContractFactory('Context')).deploy();
//     await ctx.setComparisonOpcodesAddr(comparisonOpcodesLibAddr);
//     await ctx.setBranchingOpcodesAddr(branchingOpcodesLibAddr);
//     await ctx.setLogicalOpcodesAddr(logicalOpcodesLibAddr);
//     await ctx.setOtherOpcodesAddr(otherOpcodesLibAddr);

//     // Create Stack instance
//     const StackCont = await ethers.getContractFactory('Stack');
//     const contextStackAddress = await ctx.stack();
//     stack = StackCont.attach(contextStackAddress);

//     // Deploy Application
//     app = await (
//       await ethers.getContractFactory('App', { libraries: { Executor: executorLibAddr } })
//     ).deploy(preprAddr, parserAddr, ctx.address);
//     appAddrHex = app.address.slice(2);
//   });

//   it('0 + 0', async () => {
//     await app.parse('0 + 0');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [0]);
//   });

//   it('0 - 0', async () => {
//     await app.parse('0 - 0');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [0]);
//   });

//   it('0 + 1', async () => {
//     await app.parse('0 + 1');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [1]);
//   });

//   it('1 - 0', async () => {
//     await app.parse('1 - 0');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [1]);
//   });

//   it('2 + 3', async () => {
//     await app.parse('2 + 3');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [5]);
//   });

//   it('7 - 3', async () => {
//     await app.parse('7 - 3');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [4]);
//   });

//   it('2 * 3', async () => {
//     await app.parse('2 * 3');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [6]);
//   });

//   it('2 / 3', async () => {
//     await app.parse('2 / 3');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [0]);
//   });

//   it('20 / 3', async () => {
//     await app.parse('20 / 3');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [6]);
//   });

//   it('21 / 3', async () => {
//     await app.parse('21 / 3');
//     await app.execute();
//     await checkStackTailv2(StackValue, stack, [7]);
//   });

//   it('1122334433', async () => {
//     await app.parse('1122334433');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1122334433);
//   });

//   it('2 3 -> 2 3', async () => {
//     await app.parse('2 3');
//     await app.execute();
//     await checkStackTail(StackValue, stack, 2, [2, 3]);
//   });

//   it('5 == 5', async () => {
//     await app.parse('5 == 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 != 6', async () => {
//     await app.parse('5 != 6');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 < 6', async () => {
//     await app.parse('5 < 6');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 < 5 = false', async () => {
//     await app.parse('5 < 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 0);
//   });

//   it('6 > 5', async () => {
//     await app.parse('6 > 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 > 5 = false', async () => {
//     await app.parse('5 > 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 0);
//   });

//   it('5 <= 5', async () => {
//     await app.parse('5 <= 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 <= 6', async () => {
//     await app.parse('5 <= 6');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 >= 5', async () => {
//     await app.parse('5 >= 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('6 >= 5', async () => {
//     await app.parse('6 >= 5');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('5 6 swap -> 6 5', async () => {
//     await app.parse('5 swap 6');
//     await app.execute();
//     await checkStackTail(StackValue, stack, 2, [6, 5]);
//   });

//   describe('Logical AND', async () => {
//     it('1 && 0 = false', async () => {
//       await app.parse('1 and 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('1 && 1 = true', async () => {
//       await app.parse('1 and 1');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('0 && 1 = false', async () => {
//       await app.parse('0 and 1');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('0 && 0 = false', async () => {
//       await app.parse('0 and 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('3 && 3 = false', async () => {
//       await app.parse('3 and 3');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('(((1 && 5) && 7) && 0) = 0', async () => {
//       await app.parse('1 and 5 and 7 and 0');
//       await app.execute();

//       await checkStack(StackValue, stack, 1, 0);
//     });
//   });

//   describe('Logical OR', async () => {
//     it('1 || 0 = true', async () => {
//       await app.parse('1 or 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('1 || 1 = true', async () => {
//       await app.parse('1 or 1');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('0 || 5 = true', async () => {
//       await app.parse('0 or 5');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('0 || 0 = false', async () => {
//       await app.parse('0 or 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('3 || 3 = false', async () => {
//       await app.parse('3 or 3');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('0 || 0 || 3', async () => {
//       await app.parse('0 or 0 or 3');
//       await app.execute();

//       await checkStack(StackValue, stack, 1, 1);
//     });
//   });

//   describe('Logical XOR', async () => {
//     it('0 xor 0 = false', async () => {
//       await app.parse('0 xor 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('1 xor 0 = true', async () => {
//       await app.parse('1 xor 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('0 xor 1 = true', async () => {
//       await app.parse('0 xor 1');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('1 xor 1 = false', async () => {
//       await app.parse('1 xor 1');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('5 xor 0 = true', async () => {
//       await app.parse('5 xor 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('0 xor 5 = true', async () => {
//       await app.parse('0 xor 5');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('5 xor 6 = false', async () => {
//       await app.parse('5 xor 6');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//   });

//   describe('Logical NOT', async () => {
//     it('NOT 0 = 1', async () => {
//       await app.parse('! 0');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });
//     it('NOT 1 = 0', async () => {
//       await app.parse('! 1');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//     it('NOT 3 = 0', async () => {
//       await app.parse('! 3');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });

//     it('NOT NOT 3 = 1', async () => {
//       await app.parse('! (! 3)');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('NOT NOT NOT 3 = 0', async () => {
//       await app.parse('! (! (! 3))');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });
//   });

//   it('push false', async () => {
//     await app.parse('bool false');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 0);
//   });

//   it('push true', async () => {
//     await app.parse('bool true');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('blockNumber', async () => {
//     await app.parse('blockNumber');
//     const tx = await app.execute();
//     await checkStack(StackValue, stack, 1, tx.blockNumber!);
//   });

//   it('blockTimestamp', async () => {
//     await app.parse('blockTimestamp');
//     await app.execute();
//     const block = await ethers.provider.getBlock('latest');
//     await checkStack(StackValue, stack, 1, block.timestamp);
//   });

//   it('TIME', async () => {
//     // TIME is an alias for blockTimestamp
//     await app.parse('TIME');
//     await app.execute();
//     const block = await ethers.provider.getBlock('latest');
//     await checkStack(StackValue, stack, 1, block.timestamp);
//   });

//   it('blockChainId', async () => {
//     await app.parse('blockChainId');
//     const tx = await app.execute();
//     await checkStack(StackValue, stack, 1, tx.chainId);
//   });

//   it('setLocalBool', async () => {
//     await app.parse('setLocalBool BOOLVAR true');
//     await app.execute();
//     expect(await app.getStorageBool(hex4Bytes('BOOLVAR'))).to.equal(true);
//     await app.parse('setLocalBool BOOLVAR false');
//     await app.execute();
//     expect(await app.getStorageBool(hex4Bytes('BOOLVAR'))).to.equal(false);
//   });

//   it('setUint256', async () => {
//     await app.parse('(4 + 17) setUint256 VAR');
//     await app.execute();
//     expect(await app.getStorageUint256(hex4Bytes('VAR'))).to.equal(21);

//     await app.setStorageUint256(hex4Bytes('X'), 10);
//     await app.parse('(loadLocal uint256 X + 15) setUint256 VAR');
//     await app.execute();
//     expect(await app.getStorageUint256(hex4Bytes('VAR'))).to.equal(25);
//   });

//   describe('loadLocal', () => {
//     it('loadLocal uint256 NUMBER', async () => {
//       await app.setStorageUint256(hex4Bytes('NUMBER'), 777);
//       await app.parse('loadLocal uint256 NUMBER');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 777);
//     });

//     it('loadLocal uint256 NUMBER (1000) > loadLocal uint256 NUMBER2 (15)', async () => {
//       // Set NUMBER
//       const bytes32Number = hex4Bytes('NUMBER');
//       await app.setStorageUint256(bytes32Number, 1000);

//       // Set NUMBER2
//       const bytes32Number2 = hex4Bytes('NUMBER2');
//       await app.setStorageUint256(bytes32Number2, 15);

//       await app.parse('loadLocal uint256 NUMBER > loadLocal uint256 NUMBER2');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH', async () => {
//       await app.setStorageUint256(hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
//       await app.setStorageUint256(hex4Bytes('TIMESTAMP'), lastBlockTimestamp);

//       await app.parse('loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('loadLocal uint256 TIMESTAMP > loadLocal uint256 NEXT_MONTH', async () => {
//       await app.setStorageUint256(hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
//       await app.setStorageUint256(hex4Bytes('TIMESTAMP'), lastBlockTimestamp);

//       await app.parse('loadLocal uint256 TIMESTAMP > loadLocal uint256 NEXT_MONTH');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });

//     it('loadLocal bool A (false)', async () => {
//       await app.setStorageBool(hex4Bytes('A'), false);

//       await app.parse('loadLocal bool A');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });

//     it('loadLocal bool B (true)', async () => {
//       await app.setStorageBool(hex4Bytes('B'), true);

//       await app.parse('loadLocal bool B');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('loadLocal bool A (false) != loadLocal bool B (true)', async () => {
//       await app.setStorageBool(hex4Bytes('A'), false);
//       await app.setStorageBool(hex4Bytes('B'), true);

//       await app.parse('loadLocal bool A != loadLocal bool B');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('NOR loadLocal bool A (false) != loadLocal bool B (true)', async () => {
//       await app.setStorageBool(hex4Bytes('A'), false);
//       await app.setStorageBool(hex4Bytes('B'), true);

//       await app.parse('! (loadLocal bool A != loadLocal bool B)');
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });

//     describe('opLoadLocalAddress', () => {
//       it('addresses are equal', async () => {
//         await app.setStorageAddress(
//           hex4Bytes('ADDR'),
//           '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
//         );
//         await app.setStorageAddress(
//           hex4Bytes('ADDR2'),
//           '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
//         );

//         await app.parse('loadLocal address ADDR == loadLocal address ADDR2');
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 1);
//       });

//       it('addresses are not equal', async () => {
//         await app.setStorageAddress(
//           hex4Bytes('ADDR'),
//           '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
//         );
//         await app.setStorageAddress(
//           hex4Bytes('ADDR2'),
//           '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836'
//         );

//         await app.parse('loadLocal address ADDR == loadLocal address ADDR2');
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 0);
//       });
//     });

//     describe('opLoadLocalBytes32', () => {
//       it('bytes32 are equal', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x1234500000000000000000000000000000000000000000000000000000000001'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x1234500000000000000000000000000000000000000000000000000000000001'
//         );

//         await app.parse('loadLocal bytes32 BYTES == loadLocal bytes32 BYTES2');
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 1);
//       });

//       it('bytes32 are not equal', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x1234500000000000000000000000000000000000000000000000000000000001'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x1234500000000000000000000000000000000000000000000000000000000011'
//         );

//         await app.parse('loadLocal bytes32 BYTES == loadLocal bytes32 BYTES2');
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 0);
//       });

//       it('should revert if values visually shifted, but still not the same', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x0000000000000000000000000000000000000000000000000000000000100000'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x0000000000000000000000000000000000000000000000000000000000000010'
//         );

//         await app.parse('loadLocal bytes32 BYTES == loadLocal bytes32 BYTES2');
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 0);
//       });
//     });
//   });

//   describe('loadRemote', () => {
//     it('loadRemote uint256 NUMBER', async () => {
//       await app.setStorageUint256(hex4Bytes('NUMBER'), 777);

//       await app.parse(`loadRemote uint256 NUMBER ${appAddrHex}`);
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 777);
//     });

//     it('loadRemote uint256 NUMBER (1000) > loadRemote uint256 NUMBER2 (15)', async () => {
//       // Set NUMBER
//       const bytes32Number = hex4Bytes('NUMBER');
//       await app.setStorageUint256(bytes32Number, 1000);

//       // Set NUMBER2
//       const bytes32Number2 = hex4Bytes('NUMBER2');
//       await app.setStorageUint256(bytes32Number2, 15);

//       await app.parse(
//         `loadRemote uint256 NUMBER ${appAddrHex} > loadRemote uint256 NUMBER2 ${appAddrHex}`
//       );
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('loadLocal uint256 TIMESTAMP < loadRemote uint256 NEXT_MONTH', async () => {
//       await app.setStorageUint256(hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
//       await app.setStorageUint256(hex4Bytes('TIMESTAMP'), lastBlockTimestamp);

//       await app.parse(`loadLocal uint256 TIMESTAMP < loadRemote uint256 NEXT_MONTH ${appAddrHex}`);
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('loadRemote bool A (false)', async () => {
//       await app.setStorageBool(hex4Bytes('A'), false);

//       await app.parse(`loadRemote bool A ${appAddrHex}`);
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 0);
//     });

//     it('loadRemote bool B (true)', async () => {
//       await app.setStorageBool(hex4Bytes('B'), true);

//       await app.parse(`loadRemote bool B ${appAddrHex}`);
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     it('loadRemote bool A (false) != loadRemote bool B (true)', async () => {
//       await app.setStorageBool(hex4Bytes('A'), false);
//       await app.setStorageBool(hex4Bytes('B'), true);

//       await app.parse(`loadRemote bool A ${appAddrHex} != loadRemote bool B ${appAddrHex}`);
//       await app.execute();
//       await checkStack(StackValue, stack, 1, 1);
//     });

//     describe('opLoadRemoteAddress', () => {
//       it('addresses are equal', async () => {
//         await app.setStorageAddress(
//           hex4Bytes('ADDR'),
//           '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
//         );
//         await app.setStorageAddress(
//           hex4Bytes('ADDR2'),
//           '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
//         );

//         await app.parse(
//           `loadRemote address ADDR ${appAddrHex} == loadRemote address ADDR2 ${appAddrHex}`
//         );
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 1);
//       });

//       it('different addresses are not equal', async () => {
//         await app.setStorageAddress(
//           hex4Bytes('ADDR'),
//           '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
//         );
//         await app.setStorageAddress(
//           hex4Bytes('ADDR2'),
//           '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836'
//         );

//         await app.parse(
//           `loadRemote address ADDR ${appAddrHex} == loadRemote address ADDR2 ${appAddrHex}`
//         );
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 0);
//       });
//     });

//     describe('opLoadRemoteBytes32', () => {
//       it('bytes32 are equal', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x1234500000000000000000000000000000000000000000000000000000000001'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x1234500000000000000000000000000000000000000000000000000000000001'
//         );

//         await app.parse(
//           `loadRemote bytes32 BYTES ${appAddrHex} == loadRemote bytes32 BYTES2 ${appAddrHex}`
//         );
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 1);
//       });

//       it('bytes32 are not equal', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x1234500000000000000000000000000000000000000000000000000000000001'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x1234500000000000000000000000000000000000000000000000000000000011'
//         );

//         await app.parse(
//           `loadRemote bytes32 BYTES ${appAddrHex} == loadRemote bytes32 BYTES2 ${appAddrHex}`
//         );
//         await app.execute();
//         await checkStack(StackValue, stack, 1, 0);
//       });

//       it('bytes32 calculates 3 - 1 in bytes32 ', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x0000000000000000000000000000000000000000000000000000000000000003'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x0000000000000000000000000000000000000000000000000000000000000001'
//         );

//         await app.parse(
//           `loadRemote bytes32 BYTES ${appAddrHex} - loadRemote bytes32 BYTES2 ${appAddrHex}`
//         );
//         await app.execute();
//         // 3 - 1 = 2
//         await checkStack(StackValue, stack, 1, 2);
//       });

//       it('bytes32 calculates 0 - 2 ', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0x0000000000000000000000000000000000000000000000000000000000000000'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x0000000000000000000000000000000000000000000000000000000000000001'
//         );

//         await app.parse(
//           `loadRemote bytes32 BYTES ${appAddrHex} - loadRemote bytes32 BYTES2 ${appAddrHex}`
//         );
//         await expect(app.execute()).to.be.revertedWith('EXC3');
//       });

//       it('bytes32 should revert if max bytes + 1 ', async () => {
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES'),
//           '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
//         );
//         await app.setStorageBytes32(
//           hex4Bytes('BYTES2'),
//           '0x0000000000000000000000000000000000000000000000000000000000000001'
//         );

//         await app.parse(
//           `loadRemote bytes32 BYTES ${appAddrHex} + loadRemote bytes32 BYTES2 ${appAddrHex}`
//         );
//         await expect(app.execute()).to.be.revertedWith('EXC3');
//       });
//     });
//   });

//   it('msgSender', async () => {
//     const [sender] = await ethers.getSigners();
//     await app.setStorageAddress(hex4Bytes('SENDER'), sender.address);
//     await app.parse('loadLocal address SENDER == msgSender');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('msgValue', async () => {
//     const oneEth = parseEther('1');
//     await app.parse('msgValue');
//     await app.execute({ value: oneEth });
//     await checkStack(StackValue, stack, 1, oneEth.toString());
//   });

//   it('sendEth', async () => {
//     const [vault, receiver] = await ethers.getSigners();
//     await app.setStorageAddress(hex4Bytes('RECEIVER'), receiver.address);
//     const twoEth = parseEther('2');

//     await app.parse(`sendEth RECEIVER ${twoEth.toString()}`);

//     // No ETH on the contract
//     await expect(app.execute()).to.be.revertedWith('EXC3');

//     // Enough ETH on the contract
//     await vault.sendTransaction({ to: app.address, value: twoEth });
//     await expect(await app.execute()).to.changeEtherBalance(receiver, twoEth);
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('transfer', async () => {
//     const [, receiver] = await ethers.getSigners();

//     const Token = await ethers.getContractFactory('Token');
//     const dai = await Token.deploy(parseEther('1000'));

//     const oneDAI = parseEther('1');
//     await dai.transfer(app.address, oneDAI);
//     expect(await dai.balanceOf(app.address)).to.equal(oneDAI);

//     await app.setStorageAddress(hex4Bytes('DAI'), dai.address);
//     await app.setStorageAddress(hex4Bytes('RECEIVER'), receiver.address);

//     await app.parse(`transfer DAI RECEIVER ${oneDAI.toString()}`);
//     await app.execute();
//     expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('transferVar', async () => {
//     const [, receiver] = await ethers.getSigners();

//     const Token = await ethers.getContractFactory('Token');
//     const dai = await Token.deploy(parseEther('1000'));

//     const oneDAI = parseEther('1');
//     await dai.transfer(app.address, oneDAI);
//     expect(await dai.balanceOf(app.address)).to.equal(oneDAI);

//     await app.setStorageAddress(hex4Bytes('DAI'), dai.address);
//     await app.setStorageAddress(hex4Bytes('RECEIVER'), receiver.address);
//     await app.setStorageUint256(hex4Bytes('AMOUNT'), oneDAI.toString());

//     await app.parse('transferVar DAI RECEIVER AMOUNT');
//     await app.execute();
//     expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('transferFrom', async () => {
//     const [owner, receiver] = await ethers.getSigners();

//     const Token = await ethers.getContractFactory('Token');
//     const dai = await Token.deploy(parseEther('1000'));

//     const oneDAI = parseEther('1');
//     await dai.connect(owner).approve(app.address, oneDAI);
//     expect(await dai.allowance(owner.address, app.address)).to.equal(oneDAI);

//     await app.setStorageAddress(hex4Bytes('DAI'), dai.address);
//     await app.setStorageAddress(hex4Bytes('OWNER'), owner.address);
//     await app.setStorageAddress(hex4Bytes('RECEIVER'), receiver.address);

//     await app.parse(`transferFrom DAI OWNER RECEIVER ${oneDAI.toString()}`);
//     await app.execute();
//     expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('transferFromVar', async () => {
//     const [owner, receiver] = await ethers.getSigners();

//     const Token = await ethers.getContractFactory('Token');
//     const dai = await Token.deploy(parseEther('1000'));

//     const oneDAI = parseEther('1');
//     await dai.connect(owner).approve(app.address, oneDAI);
//     expect(await dai.allowance(owner.address, app.address)).to.equal(oneDAI);

//     await app.setStorageAddress(hex4Bytes('DAI'), dai.address);
//     await app.setStorageAddress(hex4Bytes('OWNER'), owner.address);
//     await app.setStorageAddress(hex4Bytes('RECEIVER'), receiver.address);
//     await app.setStorageUint256(hex4Bytes('AMOUNT'), oneDAI.toString());

//     await app.parse('transferFromVar DAI OWNER RECEIVER AMOUNT');
//     await app.execute();
//     expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('balance of', async () => {
//     const [user] = await ethers.getSigners();

//     const Token = await ethers.getContractFactory('Token');
//     const dai = await Token.connect(user).deploy(parseEther('1000'));

//     await app.setStorageAddress(hex4Bytes('DAI'), dai.address);
//     await app.setStorageAddress(hex4Bytes('USER'), user.address);

//     await app.parse('balanceOf DAI USER');
//     await app.execute();
//     // expect(await dai.balanceOf(user.address)).to.equal(parseEther('1000'));
//     await checkStack(StackValue, stack, 1, parseEther('1000'));
//   });

//   describe('if-else statement', () => {
//     it('simple; using `branch` keyword', async () => {
//       await app.parse(
//         `
//         bool false
//         ifelse AA BB

//         branch AA {
//            5 setUint256 A
//         }

//         branch BB {
//           7 setUint256 A
//         }
//       `
//       );
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('A'))).to.equal(7);
//     });

//     it('complex; using `end` keyword', async () => {
//       const ONE = new Array(64).join('0') + 1;
//       const TWO = new Array(64).join('0') + 2;
//       const FIVE = new Array(64).join('0') + 5;
//       const SIX = new Array(64).join('0') + 6;
//       const SEVEN = new Array(64).join('0') + 7;

//       await app.parse(
//         `

//       ${ONE}

//       bool true
//       bool true
//       bool false
//       if C
//       ifelse D E
//         ${TWO}
//       end
//       C {
//         ${FIVE}
//       }
//       D {
//         ${SIX}
//       }
//       E {
//         ${SEVEN}
//       }
//     `
//       );
//       await app.execute();
//       await checkStackTailv2(StackValue, stack, [1, 1, 6, 2]);
//     });
//   });

//   it('TIMESTAMP > PREV_MONTH', async () => {
//     await app.setStorageUint256(hex4Bytes('PREV_MONTH'), PREV_MONTH);
//     await app.setStorageUint256(hex4Bytes('TIMESTAMP'), lastBlockTimestamp);
//     await app.parse('loadLocal uint256 TIMESTAMP > loadLocal uint256 PREV_MONTH');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('TIMESTAMP < NEXT_MONTH', async () => {
//     await app.setStorageUint256(hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
//     await app.setStorageUint256(hex4Bytes('TIMESTAMP'), lastBlockTimestamp);
//     await app.parse('(loadLocal uint256 TIMESTAMP) < (loadLocal uint256 NEXT_MONTH)');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('block number < block timestamp', async () => {
//     await app.parse('blockNumber < blockTimestamp');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   it('block number < TIME', async () => {
//     // TIME is an alias for blockTimestamp
//     await app.parse('blockNumber < TIME');
//     await app.execute();
//     await checkStack(StackValue, stack, 1, 1);
//   });

//   describe('((time > init) and (time < expiry)) or (risk != true)', () => {
//     const ITS_RISKY = true;
//     const NOT_RISKY = false;

//     async function testCase(INIT: number, EXPIRY: number, RISK: boolean, target: number) {
//       await app.setStorageUint256(hex4Bytes('INIT'), INIT);
//       await app.setStorageUint256(hex4Bytes('EXPIRY'), EXPIRY);
//       await app.setStorageUint256(hex4Bytes('TIMESTAMP'), lastBlockTimestamp);
//       await app.setStorageBool(hex4Bytes('RISK'), RISK);

//       await app.parse(
//         `
//         (loadLocal uint256 TIMESTAMP > loadLocal uint256 INIT)
//         and
//         (loadLocal uint256 TIMESTAMP < loadLocal uint256 EXPIRY)
//         or
//         (loadLocal bool RISK != bool true)
//         `
//       );
//       await app.execute();
//       await checkStack(StackValue, stack, 1, target);
//     }

//     // T - true, F - false
//     it('((T & T) | T) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, NOT_RISKY, 1));
//     it('((T & F) | T) == T', async () => testCase(PREV_MONTH, PREV_MONTH, NOT_RISKY, 1));
//     it('((F & T) | T) == T', async () => testCase(NEXT_MONTH, NEXT_MONTH, NOT_RISKY, 1));
//     it('((F & F) | T) == T', async () => testCase(NEXT_MONTH, PREV_MONTH, NOT_RISKY, 1));
//     it('((T & T) | F) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, ITS_RISKY, 1));
//     it('((T & F) | F) == F', async () => testCase(PREV_MONTH, PREV_MONTH, ITS_RISKY, 0));
//     it('((F & T) | F) == F', async () => testCase(NEXT_MONTH, NEXT_MONTH, ITS_RISKY, 0));
//     it('((F & F) | F) == F', async () => testCase(NEXT_MONTH, PREV_MONTH, ITS_RISKY, 0));
//   });

//   describe('function without parameters, without return value', () => {
//     it('func SUM_OF_NUMBERS stores a value of sum', async () => {
//       const input = `
//         func SUM_OF_NUMBERS endf
//         end

//         SUM_OF_NUMBERS {
//           (6 + 8) setUint256 SUM
//         }
//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
//     });

//     it('func SUM_OF_NUMBERS with additional set variables before functions name', async () => {
//       const input = `
//         (2 * 250) setUint256 RES_1
//         bool false
//         func SUM_OF_NUMBERS endf
//         end

//         SUM_OF_NUMBERS {
//           (6 + 8) setUint256 SUM
//           bool false
//           (loadLocal uint256 RES_1 / 2) setUint256 RES_2
//         }

//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
//       expect(await app.getStorageUint256(hex4Bytes('RES_1'))).to.equal(500);
//       expect(await app.getStorageUint256(hex4Bytes('RES_2'))).to.equal(250);
//     });

//     it('func SUM_OF_NUMBERS with additional set variables after functions name', async () => {
//       const input = `
//         func SUM_OF_NUMBERS endf

//         (loadLocal uint256 RES_1 * 3) setUint256 RES_2
//         end

//         SUM_OF_NUMBERS {
//           (6 + 8) setUint256 SUM
//           bool false
//           (500 / 2) setUint256 RES_1
//         }
//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
//       expect(await app.getStorageUint256(hex4Bytes('RES_1'))).to.equal(250);
//       expect(await app.getStorageUint256(hex4Bytes('RES_2'))).to.equal(750);
//     });

//     it('two func in the code', async () => {
//       const input = `
//         func SUM_OF_NUMBERS endf
//         func MUL_NUMBERS endf
//         end

//         SUM_OF_NUMBERS {
//           (11 + 22) setUint256 SUM_RESULT
//         }

//         MUL_NUMBERS {
//           (11 * 22) setUint256 MUL_RESULT
//         }
//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM_RESULT'))).to.equal(33);
//       expect(await app.getStorageUint256(hex4Bytes('MUL_RESULT'))).to.equal(242);
//     });

//     it('two func in the code with storing used data', async () => {
//       const input = `
//         11 setUint256 A
//         22 setUint256 B
//         func SUM_OF_NUMBERS endf
//         33 setUint256 C
//         func MUL_NUMBERS endf
//         end

//         SUM_OF_NUMBERS {
//           (loadLocal uint256 A + loadLocal uint256 B) setUint256 SUM_RESULT
//         }

//         MUL_NUMBERS {
//           (loadLocal uint256 A * loadLocal uint256 B) setUint256 MUL_RESULT
//         }

//         44 setUint256 D
//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM_RESULT'))).to.equal(33);
//       expect(await app.getStorageUint256(hex4Bytes('MUL_RESULT'))).to.equal(242);
//       expect(await app.getStorageUint256(hex4Bytes('A'))).to.equal(11);
//       expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
//       expect(await app.getStorageUint256(hex4Bytes('C'))).to.equal(33);
//       expect(await app.getStorageUint256(hex4Bytes('D'))).to.equal(0);
//     });
//   });

//   describe('Using stored variables without a loadLocal opcode', () => {
//     it('get sum of numbers', async () => {
//       const input = `
//         uint256 6 setUint256 A
//         (A + 2) setUint256 SUM
//         (4 + SUM) setUint256 SUM2
//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(8);
//       expect(await app.getStorageUint256(hex4Bytes('SUM2'))).to.equal(12);
//     });
//   });

//   describe('function with parameters, without return value', () => {
//     it('func SUM_OF_NUMBERS with parameters (get uint256 variable from storage) ', async () => {
//       const input = `
//         6 8
//         func SUM_OF_NUMBERS 2 endf
//         end

//         SUM_OF_NUMBERS {
//           (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
//         }
//         `;
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
//     });

//     it('should revert if parameters provided less then amount parameters number', async () => {
//       const input = `
//         6
//         func SUM_OF_NUMBERS 2 endf
//         end

//         SUM_OF_NUMBERS {
//           (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
//         }
//         `;
//       await expect(app.parse(input)).to.be.revertedWith('PRP2');
//     });

//     it('should revert if func SUM_OF_NUMBERS provides zero parameters', async () => {
//       const input = `
//         6 8
//         func SUM_OF_NUMBERS 0 endf
//         end

//         SUM_OF_NUMBERS {
//           (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
//         }
//         `;
//       await expect(app.parse(input)).to.be.revertedWith('PRP1');
//     });

//     it('should revert if func SUM provides string instead of number for parameters', async () => {
//       const input = `
//         6 8
//         func SUM test endf
//         end

//         SUM_OF_NUMBERS {
//           (loadLocal uint256 SUM_1 + loadLocal uint256 SUM_2) setUint256 SUM
//         }
//         `;
//       await expect(app.parse(input)).to.be.revertedWith('SUT3');
//     });
//   });

//   describe('Simplified writing number in wei (setUint256)', () => {
//     it('should store a simple number with 18 decimals', async () => {
//       const input = '(uint256 1e18) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('1', 18));
//     });

//     it('should store a simple number with 18 decimals without uint256 type', async () => {
//       const input = '(123e18) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
//     });

//     it('should store a simple number with 36 decimals', async () => {
//       const input = '(uint256 1e36) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('1', 36));
//     });

//     it('should store a long number with 18 decimals', async () => {
//       const input = '(uint256 1000000000000000e18) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(
//         parseUnits('1000000000000000', 18)
//       );
//     });

//     it('should store a simple number with 10 decimals', async () => {
//       const input = '(uint256 146e10) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('146', 10));
//     });

//     it('should store a long number with 10 decimals', async () => {
//       const input = '(uint256 1000000000000000e10) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(
//         parseUnits('1000000000000000', 10)
//       );
//     });

//     it('should store a simple number without decimals even using simplified method', async () => {
//       const input = '(uint256 123e0) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(123);
//     });

//     it('should store a long number without decimals even using simplified method', async () => {
//       const input = '(uint256 1000000000000000e0) setUint256 SUM';
//       await app.parse(input);
//       await app.execute();
//       expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(1000000000000000);
//     });

//     it('should revert if tried to put several `e` symbol', async () => {
//       const input = '(uint256 10000000e00000000e18) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('SUT5');
//     });

//     it('should revert if tried to put not `e` symbol', async () => {
//       const input = '(uint256 10000000a18) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('SUT5');
//     });

//     it('should revert if tried to put Upper `E` symbol', async () => {
//       const input = '(uint256 10000000E18) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('SUT5');
//     });

//     it('should revert if tried to put `0x65` symbol', async () => {
//       const input = '(uint256 100000000x6518) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('SUT5');
//     });

//     it('should revert if base was not provided', async () => {
//       const input = '(uint256 e18) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('PRS1');
//     });

//     it('should revert if decimals does not exist', async () => {
//       const input = '(uint256 45e) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('SUT6');
//     });

//     it('should revert if two `e` were provided', async () => {
//       const input = '(uint256 45ee6) setUint256 SUM';
//       await expect(app.parse(input)).to.be.revertedWith('SUT5');
//     });
//   });
// });
