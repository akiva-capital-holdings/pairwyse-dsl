import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { deployBase, deployOpcodeLibs } from '../../../scripts/utils/deploy.utils';
import { Context, Stack, ExecutorMock } from '../../../typechain-types';
import { checkStack, checkStackTail, hex4Bytes } from '../../utils/utils';

const { ethers } = hre;

describe('Executor', () => {
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  let app: ExecutorMock;
  let sender: SignerWithAddress;

  before(async () => {
    [sender] = await ethers.getSigners();

    // Deploy libraries
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    const [, executorLibAddr] = await deployBase(hre);

    // Deploy ExecutorMock
    app = await (
      await ethers.getContractFactory('ExecutorMock', {
        libraries: { Executor: executorLibAddr },
      })
    ).deploy();

    // Deploy & setup Context
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;
    await ctx.setAppAddress(app.address);
    await ctx.setMsgSender(sender.address);
    await ctx.setComparisonOpcodesAddr(comparisonOpcodesLibAddr);
    await ctx.setBranchingOpcodesAddr(branchingOpcodesLibAddr);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLibAddr);
    await ctx.setOtherOpcodesAddr(otherOpcodesLibAddr);

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);
  });

  afterEach(async () => {
    stack.clear();
    ctx.setPc(0);
  });

  describe('execute()', async () => {
    it('error: empty program', async () => {
      await expect(app.execute(ctxAddr)).to.be.revertedWith('EXC1');
    });

    it('error: did not find selector for opcode', async () => {
      await ctx.setProgram('0x99');
      await expect(app.execute(ctxAddr)).to.be.revertedWith('EXC2');
    });

    it('error: call not success', async () => {
      await ctx.setProgram('0x05');
      await expect(app.execute(ctxAddr)).to.be.revertedWith('EXC3');
    });

    describe('if', () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const FOUR = new Array(64).join('0') + 4;

      it('nothing in the stack', async () => {
        await ctx.setProgram(
          '0x' +
            '25' + // if
            '0027' + // position of the `action` branch
            '1a' + // uin256
            `${FOUR}` + // FOUR
            '24' + // end of body
            '1a' + // action: uint256
            `${ONE}` + // action: ONE
            '1a' + // action: uint256
            `${TWO}` + // action: TWO
            '24' // action: end
        );
        await app.execute(ctxAddr);
        await checkStackTail(stack, []);
      });

      it('if condition is true', async () => {
        await ctx.setProgram(
          '0x' +
            '18' + // bool
            '01' + // true
            '25' + // if
            '0027' + // position of the `action` branch
            '1a' + // uin256
            `${FOUR}` + // FOUR
            '24' + // end of body
            '1a' + // action: uint256
            `${ONE}` + // action: ONE
            '1a' + // action: uint256
            `${TWO}` + // action: TWO
            '24' // action: end
        );
        await app.execute(ctxAddr);
        await checkStackTail(stack, [1, 2, 4]);
      });

      it('if condition is false', async () => {
        await ctx.setProgram(
          '0x' +
            '18' + // bool
            '00' + // false
            '25' + // if
            '0027' + // position of the `action` branch
            '1a' + // uin256
            `${FOUR}` + // FOUR
            '24' + // end of body
            '1a' + // action: uint256
            `${ONE}` + // action: ONE
            '1a' + // action: uint256
            `${TWO}` + // action: TWO
            '24' // action: end
        );
        await app.execute(ctxAddr);
        await checkStackTail(stack, []);
      });
    });

    describe('if-else', () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;
      const FOUR = new Array(64).join('0') + 4;

      it('nothing in the stack', async () => {
        const programTrue = `0x 23 0027 0049  1a ${THREE} 24  1a ${ONE} 24  1a ${TWO} 24`
          .split(' ')
          .filter((x) => !!x)
          .join('');

        await ctx.setProgram(programTrue);
        await app.execute(ctxAddr);
        await checkStackTail(stack, [2, 3]);
      });

      it('if condition is true', async () => {
        /**
         * 18 bool
         * 01 true
         * 0022 offset of the `false` branch
         * 0044 offset of the body
         * 1a uint256
         * ONE, TWO, THREE - just a uint256 number
         * 23 ifelse
         * 24 end
         */
        const programTrue = `0x 18 01 23 0029 0000  1a ${THREE} 24  1a ${ONE} 24  1a ${TWO} 24`
          .split(' ')
          .filter((x) => !!x)
          .join('');

        await ctx.setProgram(programTrue);
        await app.execute(ctxAddr);
        await checkStackTail(stack, [1, 3]);
      });

      it('if condition is true (#2)', async () => {
        const programTrue =
          '0x' +
          '18' + // bool
          '01' + // true
          '23' + // ifelse
          '0029' + // position of the `good` branch
          '006c' + // position of the `bad` branch
          '1a' + // uin256
          `${FOUR}` + // FOUR
          '24' + // end of body
          '1a' + // good: uint256
          `${ONE}` + // good: ONE
          '1a' + // good: uint256
          `${TWO}` + // good: TWO
          '24' + // good: end
          '1a' + // bad: uint256
          `${THREE}` + // bad: THREE
          '24'; // bad: end

        await ctx.setProgram(programTrue);
        await app.execute(ctxAddr);
        await checkStackTail(stack, [1, 2, 4]);
      });

      it('if condition is false', async () => {
        const programFalse = `0x 18 00 23 0029 004b  1a ${THREE} 24  1a ${ONE} 24  1a ${TWO} 24`
          .split(' ')
          .filter((x) => !!x)
          .join('');

        await ctx.setProgram(programFalse);
        await app.execute(ctxAddr);
        await checkStackTail(stack, [2, 3]);
      });

      it('if condition is false (#2)', async () => {
        const programTrue =
          '0x' +
          '18' + // bool
          '00' + // true
          '23' + // ifelse
          '0029' + // offset of the `good` branch
          '006c' + // offset of the `bad` branch
          '1a' + // uin256
          `${FOUR}` + // FOUR
          '24' + // end of body
          '1a' + // good: uint256
          `${ONE}` + // good: ONE
          '1a' + // good: uint256
          `${TWO}` + // good: TWO
          '24' + // good: end
          '1a' + // bad: uint256
          `${THREE}` + // bad: THREE
          '24'; // bad: end

        await ctx.setProgram(programTrue);
        await app.execute(ctxAddr);
        await checkStackTail(stack, [3, 4]);
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
      await checkStack(stack, 1, evalTx.blockNumber || 0);
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
      await checkStack(stack, 1, 1);
    });

    it('blockNumber < time', async () => {
      /**
       * time is an alias for blockTimestamp
       * Program is:
       * `
       *  blockNumber
       *  time
       *  <
       * `
       */
      await ctx.setProgram('0x151603');
      await app.execute(ctxAddr);
      await checkStack(stack, 1, 1);
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
           *  var NUMBER
           *  var NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1b${number}1b${number2}04`);
          await app.execute(ctxAddr);
          await checkStack(stack, 1, 1);
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
           *  var NUMBER
           *  var NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1b${number}1b${number2}06`);
          await app.execute(ctxAddr);
          await checkStack(stack, 1, 0);
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
           *  var NUMBER
           *  var NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substring(2, 10);
          const number2 = bytes32Number2.substring(2, 10);
          await ctx.setProgram(`0x1b${number}1b${number2}01`);
          await app.execute(ctxAddr);
          await checkStack(stack, 1, 1);
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
          await checkStack(stack, 1, 1);
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
          await checkStack(stack, 1, 0);
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
          await checkStack(stack, 1, 1);
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
          await checkStack(stack, 1, 1);
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
          await checkStack(stack, 1, 0);
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
          await checkStack(stack, 1, 1);
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
          await checkStack(stack, 1, 0);
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
          await checkStack(stack, 1, 1);
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
          await checkStack(stack, 1, 0);
        });
      });
    });
  });
});
