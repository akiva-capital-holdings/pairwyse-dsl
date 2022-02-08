/* eslint-disable camelcase */
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { Context, StackValue__factory, Stack, Parser } from '../../typechain';
import { ExecutorMock } from '../../typechain/ExecutorMock';
import { checkStack, checkStackTail, hex4Bytes } from '../utils/utils';

describe('Executor', () => {
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  let app: ExecutorMock;
  let parser: Parser;
  let opcodesLib: Contract;
  let StackValue: StackValue__factory;
  let sender: SignerWithAddress;

  before(async () => {
    [sender] = await ethers.getSigners();

    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    // Deploy libraries
    opcodesLib = await (await ethers.getContractFactory('Opcodes')).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    parser = await (
      await ethers.getContractFactory('Parser', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();

    // Deploy ExecutorMock
    app = await (
      await ethers.getContractFactory('ExecutorMock', {
        libraries: { Executor: executorLib.address },
      })
    ).deploy();
  });

  beforeEach(async () => {
    // Deploy & setup Context
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;
    await parser.initOpcodes(ctxAddr);
    await ctx.setAppAddress(app.address);
    await ctx.setMsgSender(sender.address);
    await ctx.setOpcodesAddr(opcodesLib.address);

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);
  });

  describe('execute()', async () => {
    it('error: empty program', async () => {
      await expect(app.execute(ctxAddr)).to.be.revertedWith('Executor: empty program');
    });

    it('error: did not find selector for opcode', async () => {
      await ctx.setProgram('0x99');
      await expect(app.execute(ctxAddr)).to.be.revertedWith(
        'Executor: did not find selector for opcode'
      );
    });

    it('error: call not success', async () => {
      await ctx.setProgram('0x05');
      await expect(app.execute(ctxAddr)).to.be.revertedWith('Executor: call not success');
    });

    describe.only('if-else', () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;

      it('nothing in the stack', async () => {
        const programTrue = `0x 23 0022 0044  1a ${ONE} 24  1a ${TWO} 24  1a ${THREE}`
          .split(' ')
          .filter((x) => !!x)
          .join('');

        await ctx.setProgram(programTrue);
        await app.execute(ctxAddr);
        await checkStackTail(StackValue, stack, 2, [2, 3]);
      });

      it('if condition is true', async () => {
        /**
         * 18 bool
         * 01 true
         * 0004 offset of the `false` branch
         * 0026 offset of the body
         * 1a uint256
         * ONE, TWO, THREE - just a uint256 number
         * 23 bnz
         * 24 end
         */
        const programTrue = `0x 18 01 23 0022 0044  1a ${ONE} 24  1a ${TWO} 24  1a ${THREE}`
          .split(' ')
          .filter((x) => !!x)
          .join('');

        await ctx.setProgram(programTrue);
        await app.execute(ctxAddr);
        await checkStackTail(StackValue, stack, 2, [1, 3]);
      });

      it('if condition is false', async () => {
        const programFalse = `0x 18 00 23 0022 0044  1a ${ONE} 24  1a ${TWO} 24  1a ${THREE}`
          .split(' ')
          .filter((x) => !!x)
          .join('');

        await ctx.setProgram(programFalse);
        await app.execute(ctxAddr);
        await checkStackTail(StackValue, stack, 2, [2, 3]);
      });
    });

    it('blockNumber', async () => {
      /**
       * Program is:
       * `
       *  blockNumber
       * `
       */
      await ctx.setProgram('0x15');
      const evalTx = await app.execute(ctxAddr);
      await checkStack(StackValue, stack, 1, evalTx.blockNumber || 0);
    });

    it('blockNumber < blockTimestamp', async () => {
      /**
       * Program is:
       * `
       *  blockNumber
       *  blockTimestamp
       *  <
       * `
       */
      await ctx.setProgram('0x151603');
      await app.execute(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });

    describe('Load local', () => {
      describe('opLoadLocalUint256', () => {
        it('17 > 15', async () => {
          // Set NUMBER
          const bytes32Number = hex4Bytes('NUMBER');
          await app.setStorageUint256(bytes32Number, 17);

          // Set NUMBER2
          const bytes32Number2 = hex4Bytes('NUMBER2');
          await app.setStorageUint256(bytes32Number2, 15);

          /**
           * The program is:
           * `
           *  loadLocalUint256 NUMBER
           *  loadLocalUint256 NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1b01${number}1b01${number2}04`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('5 <= 3', async () => {
          // Set NUMBER
          const bytes32Number = hex4Bytes('NUMBER');
          await app.setStorageUint256(bytes32Number, 5);

          // Set NUMBER2
          const bytes32Number2 = hex4Bytes('NUMBER2');
          await app.setStorageUint256(bytes32Number2, 3);

          /**
           * The program is:
           * `
           *  loadLocalUint256 NUMBER
           *  loadLocalUint256 NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1b01${number}1b01${number2}06`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });

        it('12 = 12', async () => {
          // Set NUMBER
          const bytes32Number = hex4Bytes('NUMBER');
          await app.setStorageUint256(bytes32Number, 12);

          // Set NUMBER2
          const bytes32Number2 = hex4Bytes('NUMBER2');
          await app.setStorageUint256(bytes32Number2, 12);

          /**
           * The program is:
           * `
           *  loadLocalUint256 NUMBER
           *  loadLocalUint256 NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1b01${number}1b01${number2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });
      });

      describe('opLoadLocalBytes32', () => {
        it('bytes32 are equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await app.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001'
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await app.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000001'
          );

          /**
           * The program is:
           * `
           *  opLoadLocalBytes32 BYTES
           *  opLoadLocalBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b04${bytes}1b04${bytes2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('bytes32 are not equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await app.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001'
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await app.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000011'
          );

          /**
           * The program is:
           * `
           *  opLoadLocalBytes32 BYTES
           *  opLoadLocalBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b04${bytes}1b04${bytes2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadLocalAddress', () => {
        it('addresses are equal', async () => {
          // Set ADDR
          const bytes32Bytes = hex4Bytes('ADDR');
          await app.setStorageAddress(bytes32Bytes, '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5');

          // Set ADDR2
          const bytes32Bytes2 = hex4Bytes('ADDR2');
          await app.setStorageAddress(bytes32Bytes2, '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5');

          /**
           * The program is:
           * `
           *  opLoadLocalAddress ADDR
           *  opLoadLocalAddress ADDR2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b03${bytes}1b03${bytes2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('addresses are not equal', async () => {
          // Set ADDR
          const bytes32Bytes = hex4Bytes('ADDR');
          await app.setStorageAddress(bytes32Bytes, '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5');

          // Set ADDR2
          const bytes32Bytes2 = hex4Bytes('ADDR2');
          await app.setStorageAddress(bytes32Bytes2, '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836');

          /**
           * The program is:
           * `
           *  opLoadLocalAddress ADDR
           *  opLoadLocalAddress ADDR2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b03${bytes}1b03${bytes2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadLocalBool', () => {
        it('true == true', async () => {
          // Set BOOL
          const bytes32Bytes = hex4Bytes('BOOL');
          await app.setStorageBool(bytes32Bytes, true);

          // Set BOOL2
          const bytes32Bytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(bytes32Bytes2, true);

          /**
           * The program is:
           * `
           *  opLoadLocalBool BOOL
           *  opLoadLocalBool BOOL2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b02${bytes}1b02${bytes2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('true && true', async () => {
          // Set BOOL
          const bytes32Bytes = hex4Bytes('BOOL');
          await app.setStorageBool(bytes32Bytes, true);

          // Set BOOL2
          const bytes32Bytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(bytes32Bytes2, true);

          /**
           * The program is:
           * `
           *  opLoadLocalBool BOOL
           *  opLoadLocalBool BOOL2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b02${bytes}1b02${bytes2}12`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('true == false', async () => {
          // Set BOOL
          const bytes32Bytes = hex4Bytes('BOOL');
          await app.setStorageBool(bytes32Bytes, true);

          // Set BOOL2
          const bytes32Bytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(bytes32Bytes2, false);

          /**
           * The program is:
           * `
           *  opLoadLocalBool BOOL
           *  opLoadLocalBool BOOL2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1b02${bytes}1b02${bytes2}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });
      });
    });

    describe('Load remote', () => {
      let appAddr: string;

      beforeEach(() => {
        appAddr = app.address.substring(2);
      });

      describe('opLoadRemoteUint256', () => {
        it('17 > 15', async () => {
          // Set N
          const bytes32Number = hex4Bytes('N');
          await app.setStorageUint256(bytes32Number, 17);

          // Set N2
          const bytes32Number2 = hex4Bytes('N2');
          await app.setStorageUint256(bytes32Number2, 15);

          /**
           * The program is:
           * `
           *  opLoadRemoteUint256 N
           *  opLoadRemoteUint256 N2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1c01${number}${appAddr}1c01${number2}${appAddr}04`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('5 <= 3', async () => {
          // Set N
          const bytes32Number = hex4Bytes('N');
          await app.setStorageUint256(bytes32Number, 5);

          // Set N2
          const bytes32Number2 = hex4Bytes('N2');
          await app.setStorageUint256(bytes32Number2, 3);

          /**
           * The program is:
           * `
           *  opLoadRemoteUint256 N
           *  opLoadRemoteUint256 N2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1c01${number}${appAddr}1c01${number2}${appAddr}06`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });

        it('12 = 12', async () => {
          // Set N
          const bytes32Number = hex4Bytes('N');
          await app.setStorageUint256(bytes32Number, 12);

          // Set N2
          const bytes32Number2 = hex4Bytes('N2');
          await app.setStorageUint256(bytes32Number2, 12);

          /**
           * The program is:
           * `
           *  opLoadRemoteUint256 N
           *  opLoadRemoteUint256 N2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1c01${number}${appAddr}1c01${number2}${appAddr}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });
      });

      describe('opLoadRemoteAddress', () => {
        it('addresses are equal', async () => {
          // Set ADDR
          const addrBytes = hex4Bytes('ADDR');
          await app.setStorageAddress(addrBytes, '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5');

          // Set ADDR2
          const addrBytes2 = hex4Bytes('ADDR2');
          await app.setStorageAddress(addrBytes2, '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5');

          /**
           * The program is:
           * `
           *  opLoadRemoteAddress ADDR
           *  opLoadRemoteAddress ADDR2
           *  =
           * `
           */
          const addr = addrBytes.substring(2, 10);
          const addr2 = addrBytes2.substring(2, 10);
          await ctx.setProgram(`0x1c03${addr}${appAddr}1c03${addr2}${appAddr}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('different addresses are not equal', async () => {
          // Set A
          const addrBytes = hex4Bytes('A');
          await app.setStorageAddress(addrBytes, '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5');

          // Set A2
          const addrBytes2 = hex4Bytes('A2');
          await app.setStorageAddress(addrBytes2, '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836');

          /**
           * The program is:
           * `
           *  opLoadRemoteAddress A
           *  opLoadRemoteAddress A2
           *  =
           * `
           */
          const addr = addrBytes.substring(2, 10);
          const addr2 = addrBytes2.substring(2, 10);
          await ctx.setProgram(`0x1c03${addr}${appAddr}1c03${addr2}${appAddr}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadRemoteBytes32', () => {
        it('bytes32 are equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await app.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001'
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await app.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000001'
          );

          /**
           * The program is:
           * `
           *  opLoadRemoteBytes32 BYTES
           *  opLoadRemoteBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1c04${bytes}${appAddr}1c04${bytes2}${appAddr}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('bytes32 are not equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await app.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001'
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await app.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000011'
          );

          /**
           * The program is:
           * `
           *  opLoadRemoteBytes32 BYTES
           *  opLoadRemoteBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substring(2, 10);
          const bytes2 = bytes32Bytes2.substring(2, 10);
          await ctx.setProgram(`0x1c04${bytes}${appAddr}1c04${bytes2}${appAddr}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadRemoteBool', () => {
        it('true == true', async () => {
          // Set BOOL
          const boolBytes = hex4Bytes('BOOL');
          await app.setStorageBool(boolBytes, true);

          // Set BOOL2
          const boolBytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(boolBytes2, true);

          /**
           * The program is:
           * `
           *  opLoadRemoteBool BOOL
           *  opLoadRemoteBool BOOL2
           *  =
           * `
           */
          const bool = boolBytes.substring(2, 10);
          const bool2 = boolBytes2.substring(2, 10);
          await ctx.setProgram(`0x1c02${bool}${appAddr}1c02${bool2}${appAddr}01`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 1);
        });

        it('true != true', async () => {
          // Set BOOL
          const boolBytes = hex4Bytes('BOOL');
          await app.setStorageBool(boolBytes, true);

          // Set BOOL2
          const boolBytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(boolBytes2, true);

          /**
           * The program is:
           * `
           *  opLoadRemoteBool BOOL
           *  opLoadRemoteBool BOOL2
           *  !=
           * `
           */
          const bool = boolBytes.substring(2, 10);
          const bool2 = boolBytes2.substring(2, 10);
          await ctx.setProgram(`0x1c02${bool}${appAddr}1c02${bool2}${appAddr}14`);
          await app.execute(ctxAddr);
          await checkStack(StackValue, stack, 1, 0);
        });
      });
    });
  });
});
