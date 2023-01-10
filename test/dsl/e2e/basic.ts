import * as hre from 'hardhat';
import { expect } from 'chai';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import {
  BaseApplication,
  DSLContext,
  ProgramContextMock,
  Stack,
  ExecutorMock,
  ERC20Mintable,
} from '../../../typechain-types';
import { checkStackTail, hex4Bytes, checkStack } from '../../utils/utils';
import { deployBase, deployOpcodeLibs } from '../../../scripts/utils/deploy.utils';

const { ethers, network } = hre;

describe('DSL: basic', () => {
  let stack: Stack;
  let ctx: DSLContext;
  let ctxProgram: ProgramContextMock;
  let app: BaseApplication;
  let appAddr: string;
  let executor: ExecutorMock;
  let NEXT_MONTH: number;
  let PREV_MONTH: number;
  let lastBlockTimestamp: number;
  let snapshotId: number;

  before(async () => {
    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;
    PREV_MONTH = lastBlockTimestamp - 60 * 60 * 24 * 30;

    // Deploy libraries
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    const [parserAddr, executorLibAddr, preprAddr] = await deployBase(hre);
    // Deploy ExecutorMock
    executor = await (
      await ethers.getContractFactory('ExecutorMock', {
        libraries: { Executor: executorLibAddr },
      })
    ).deploy();

    // Deploy Context & setup
    ctx = await (
      await ethers.getContractFactory('DSLContext')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr
    );
    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctxProgram.stack();
    stack = StackCont.attach(contextStackAddress);

    // Deploy Application
    app = await (
      await ethers.getContractFactory('BaseApplication', {
        libraries: { Executor: executorLibAddr },
      })
    ).deploy(parserAddr, preprAddr, ctx.address, ctxProgram.address);
    appAddr = app.address;

    await ctxProgram.setAppAddress(app.address);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('0 + 0', async () => {
    await app.parse('0 + 0');
    await app.execute();
    await checkStackTail(stack, [0]);
  });

  it('0 - 0', async () => {
    await app.parse('0 - 0');
    await app.execute();
    await checkStackTail(stack, [0]);
  });

  it('0 + 1', async () => {
    await app.parse('0 + 1');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('1 - 0', async () => {
    await app.parse('1 - 0');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('2 + 3', async () => {
    await app.parse('2 + 3');
    await app.execute();
    await checkStackTail(stack, [5]);
  });

  it('7 - 3', async () => {
    await app.parse('7 - 3');
    await app.execute();
    await checkStackTail(stack, [4]);
  });

  it('2 * 3', async () => {
    await app.parse('2 * 3');
    await app.execute();
    await checkStackTail(stack, [6]);
  });

  it('2 / 3', async () => {
    await app.parse('2 / 3');
    await app.execute();
    await checkStackTail(stack, [0]);
  });

  it('20 / 3', async () => {
    await app.parse('20 / 3');
    await app.execute();
    await checkStackTail(stack, [6]);
  });

  it('21 / 3', async () => {
    await app.parse('21 / 3');
    await app.execute();
    await checkStackTail(stack, [7]);
  });

  it('1122334433', async () => {
    await app.parse('1122334433');
    await app.execute();
    await checkStackTail(stack, [1122334433]);
  });

  it('2 3 -> 2 3', async () => {
    await app.parse('2 3');
    await app.execute();
    await checkStackTail(stack, [2, 3]);
  });

  it('5 == 5', async () => {
    await app.parse('5 == 5');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 != 6', async () => {
    await app.parse('5 != 6');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 < 6', async () => {
    await app.parse('5 < 6');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 < 5 = false', async () => {
    await app.parse('5 < 5');
    await app.execute();
    await checkStackTail(stack, [0]);
  });

  it('6 > 5', async () => {
    await app.parse('6 > 5');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 > 5 = false', async () => {
    await app.parse('5 > 5');
    await app.execute();
    await checkStackTail(stack, [0]);
  });

  it('5 <= 5', async () => {
    await app.parse('5 <= 5');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 <= 6', async () => {
    await app.parse('5 <= 6');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 >= 5', async () => {
    await app.parse('5 >= 5');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('6 >= 5', async () => {
    await app.parse('6 >= 5');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('5 6 swap -> 6 5', async () => {
    await app.parse('5 swap 6');
    await app.execute();
    await checkStackTail(stack, [6, 5]);
  });

  describe('Logical AND', async () => {
    it('1 && 0 = false', async () => {
      await app.parse('1 and 0');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('1 && 1 = true', async () => {
      await app.parse('1 and 1');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('0 && 1 = false', async () => {
      await app.parse('0 and 1');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('0 && 0 = false', async () => {
      await app.parse('0 and 0');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('3 && 3 = false', async () => {
      await app.parse('3 and 3');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('(((1 && 5) && 7) && 0) = 0', async () => {
      await app.parse('1 and 5 and 7 and 0');
      await app.execute();

      await checkStackTail(stack, [0]);
    });
  });

  describe('Logical OR', async () => {
    it('1 || 0 = true', async () => {
      await app.parse('1 or 0');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('1 || 1 = true', async () => {
      await app.parse('1 or 1');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('0 || 5 = true', async () => {
      await app.parse('0 or 5');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('0 || 0 = false', async () => {
      await app.parse('0 or 0');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('3 || 3 = false', async () => {
      await app.parse('3 or 3');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('0 || 0 || 3', async () => {
      await app.parse('0 or 0 or 3');
      await app.execute();

      await checkStackTail(stack, [1]);
    });
  });

  describe('Logical XOR', async () => {
    it('0 xor 0 = false', async () => {
      await app.parse('0 xor 0');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('1 xor 0 = true', async () => {
      await app.parse('1 xor 0');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('0 xor 1 = true', async () => {
      await app.parse('0 xor 1');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('1 xor 1 = false', async () => {
      await app.parse('1 xor 1');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('5 xor 0 = true', async () => {
      await app.parse('5 xor 0');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('0 xor 5 = true', async () => {
      await app.parse('0 xor 5');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('5 xor 6 = false', async () => {
      await app.parse('5 xor 6');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
  });

  describe('Logical NOT', async () => {
    it('NOT 0 = 1', async () => {
      await app.parse('! 0');
      await app.execute();
      await checkStackTail(stack, [1]);
    });
    it('NOT 1 = 0', async () => {
      await app.parse('! 1');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
    it('NOT 3 = 0', async () => {
      await app.parse('! 3');
      await app.execute();
      await checkStackTail(stack, [0]);
    });

    it('NOT NOT 3 = 1', async () => {
      await app.parse('! (! 3)');
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('NOT NOT NOT 3 = 0', async () => {
      await app.parse('! (! (! 3))');
      await app.execute();
      await checkStackTail(stack, [0]);
    });
  });

  it('push false', async () => {
    await app.parse('bool false');
    await app.execute();
    await checkStackTail(stack, [0]);
  });

  it('push true', async () => {
    await app.parse('bool true');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('blockNumber', async () => {
    await app.parse('blockNumber');
    const tx = await app.execute();
    await checkStackTail(stack, [tx.blockNumber!]);
  });

  it('blockTimestamp', async () => {
    await app.parse('blockTimestamp');
    await app.execute();
    const block = await ethers.provider.getBlock('latest');
    await checkStackTail(stack, [block.timestamp]);
  });

  it('time', async () => {
    // time is an alias for blockTimestamp
    await app.parse('time');
    await app.execute();
    const block = await ethers.provider.getBlock('latest');
    await checkStackTail(stack, [block.timestamp]);
  });

  it('blockChainId', async () => {
    await app.parse('blockChainId');
    const tx = await app.execute();
    await checkStackTail(stack, [tx.chainId]);
  });

  it('setLocalBool', async () => {
    await app.parse('setLocalBool BOOLVAR true');
    await app.execute();
    expect(await app.getStorageBool(hex4Bytes('BOOLVAR'))).to.equal(true);
    await app.parse('setLocalBool BOOLVAR false');
    await app.execute();
    expect(await app.getStorageBool(hex4Bytes('BOOLVAR'))).to.equal(false);
  });

  it('setUint256', async () => {
    await app.parse('(4 + 17) setUint256 VAR');
    await app.execute();
    expect(await app.getStorageUint256(hex4Bytes('VAR'))).to.equal(21);

    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('X'), 10);
    await app.parse('(var X + 15) setUint256 VAR');
    await app.execute();
    expect(await app.getStorageUint256(hex4Bytes('VAR'))).to.equal(25);
  });

  describe('variables', () => {
    describe('implicit usage', () => {
      it('NUMBER', async () => {
        await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUMBER'), 777);
        await app.parse('NUMBER');
        await app.execute();
        await checkStackTail(stack, [777]);
      });

      it('NUMBER (1000) > NUMBER2 (15)', async () => {
        // Set NUMBER
        const bytes32Number = hex4Bytes('NUMBER');
        await app['setStorageUint256(bytes32,uint256)'](bytes32Number, 1000);

        // Set NUMBER2
        const bytes32Number2 = hex4Bytes('NUMBER2');
        await app['setStorageUint256(bytes32,uint256)'](bytes32Number2, 15);

        await app.parse('NUMBER > NUMBER2');
        await app.execute();
        await checkStackTail(stack, [1]);
      });
    });

    it('var NUMBER', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUMBER'), 777);
      await app.parse('var NUMBER');
      await app.execute();
      await checkStackTail(stack, [777]);
    });

    it('var NUMBER (1000) > var NUMBER2 (15)', async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes('NUMBER');
      await app['setStorageUint256(bytes32,uint256)'](bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes('NUMBER2');
      await app['setStorageUint256(bytes32,uint256)'](bytes32Number2, 15);

      await app.parse('var NUMBER > var NUMBER2');
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('var TIMESTAMP < var NEXT_MONTH', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('TIMESTAMP'), lastBlockTimestamp);

      await app.parse('var TIMESTAMP < var NEXT_MONTH');
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('var TIMESTAMP > var NEXT_MONTH', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('TIMESTAMP'), lastBlockTimestamp);

      await app.parse('var TIMESTAMP > var NEXT_MONTH');
      await app.execute();
      await checkStackTail(stack, [0]);
    });

    it('var A (false)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('A'), false);

      await app.parse('var A');
      await app.execute();
      await checkStackTail(stack, [0]);
    });

    it('var B (true)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('B'), true);

      await app.parse('var B');
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('var A (false) != var B (true)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('A'), false);
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('B'), true);

      await app.parse('var A != var B');
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('NOR var A (false) != var B (true)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('A'), false);
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('B'), true);

      await app.parse('! (var A != var B)');
      await app.execute();
      await checkStackTail(stack, [0]);
    });

    describe('opLoadLocalBytes32', () => {
      it('bytes32 are equal', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x1234500000000000000000000000000000000000000000000000000000000001'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x1234500000000000000000000000000000000000000000000000000000000001'
        );

        await app.parse('var BYTES == var BYTES2');
        await app.execute();
        await checkStackTail(stack, [1]);
      });

      it('bytes32 are not equal', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x1234500000000000000000000000000000000000000000000000000000000001'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x1234500000000000000000000000000000000000000000000000000000000011'
        );

        await app.parse('var BYTES == var BYTES2');
        await app.execute();
        await checkStackTail(stack, [0]);
      });

      it('should revert if values visually shifted, but still not the same', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x0000000000000000000000000000000000000000000000000000000000100000'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x0000000000000000000000000000000000000000000000000000000000000010'
        );

        await app.parse('var BYTES == var BYTES2');
        await app.execute();
        await checkStackTail(stack, [0]);
      });
    });
  });

  describe('loadRemote', () => {
    it('loadRemote uint256 NUMBER', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUMBER'), 777);

      await app.parse(`loadRemote uint256 NUMBER ${appAddr}`);
      await app.execute();
      await checkStackTail(stack, [777]);
    });

    it('loadRemote uint256 NUMBER (1000) > loadRemote uint256 NUMBER2 (15)', async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes('NUMBER');
      await app['setStorageUint256(bytes32,uint256)'](bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes('NUMBER2');
      await app['setStorageUint256(bytes32,uint256)'](bytes32Number2, 15);

      await app.parse(
        `loadRemote uint256 NUMBER ${appAddr} > loadRemote uint256 NUMBER2 ${appAddr}`
      );
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('var TIMESTAMP < loadRemote uint256 NEXT_MONTH', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('TIMESTAMP'), lastBlockTimestamp);

      await app.parse(`var TIMESTAMP < loadRemote uint256 NEXT_MONTH ${appAddr}`);
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('loadRemote bool A (false)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('A'), false);

      await app.parse(`loadRemote bool A ${appAddr}`);
      await app.execute();
      await checkStackTail(stack, [0]);
    });

    it('loadRemote bool B (true)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('B'), true);

      await app.parse(`loadRemote bool B ${appAddr}`);
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    it('loadRemote bool A (false) != loadRemote bool B (true)', async () => {
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('A'), false);
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('B'), true);

      await app.parse(`loadRemote bool A ${appAddr} != loadRemote bool B ${appAddr}`);
      await app.execute();
      await checkStackTail(stack, [1]);
    });

    describe('opLoadRemoteAddress', () => {
      it('addresses are equal', async () => {
        await app['setStorageAddress(bytes32,address)'](
          hex4Bytes('ADDR'),
          '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
        );
        await app['setStorageAddress(bytes32,address)'](
          hex4Bytes('ADDR2'),
          '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
        );

        await app.parse(
          `loadRemote address ADDR ${appAddr} == loadRemote address ADDR2 ${appAddr}`
        );
        await app.execute();
        await checkStackTail(stack, [1]);
      });

      it('different addresses are not equal', async () => {
        await app['setStorageAddress(bytes32,address)'](
          hex4Bytes('ADDR'),
          '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'
        );
        await app['setStorageAddress(bytes32,address)'](
          hex4Bytes('ADDR2'),
          '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836'
        );

        await app.parse(
          `loadRemote address ADDR ${appAddr} == loadRemote address ADDR2 ${appAddr}`
        );
        await app.execute();
        await checkStackTail(stack, [0]);
      });
    });

    describe('opLoadRemoteBytes32', () => {
      it('bytes32 are equal', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x1234500000000000000000000000000000000000000000000000000000000001'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x1234500000000000000000000000000000000000000000000000000000000001'
        );

        await app.parse(
          `loadRemote bytes32 BYTES ${appAddr} == loadRemote bytes32 BYTES2 ${appAddr}`
        );
        // await app.execute();
        // await checkStackTail(stack, [1]);
      });

      it('bytes32 are not equal', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x1234500000000000000000000000000000000000000000000000000000000001'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x1234500000000000000000000000000000000000000000000000000000000011'
        );

        await app.parse(
          `loadRemote bytes32 BYTES ${appAddr} == loadRemote bytes32 BYTES2 ${appAddr}`
        );
        await app.execute();
        await checkStackTail(stack, [0]);
      });

      it('bytes32 calculates 3 - 1 in bytes32 ', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x0000000000000000000000000000000000000000000000000000000000000003'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );

        await app.parse(
          `loadRemote bytes32 BYTES ${appAddr} - loadRemote bytes32 BYTES2 ${appAddr}`
        );
        await app.execute();
        // 3 - 1 = 2
        await checkStackTail(stack, [2]);
      });

      it('bytes32 calculates 0 - 2 ', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );

        await app.parse(
          `loadRemote bytes32 BYTES ${appAddr} - loadRemote bytes32 BYTES2 ${appAddr}`
        );
        await expect(app.execute()).to.be.revertedWith('EXC3');
      });

      it('bytes32 should revert if max bytes + 1 ', async () => {
        await app.setStorageBytes32(
          hex4Bytes('BYTES'),
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
        );
        await app.setStorageBytes32(
          hex4Bytes('BYTES2'),
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );

        await app.parse(
          `loadRemote bytes32 BYTES ${appAddr} + loadRemote bytes32 BYTES2 ${appAddr}`
        );
        await expect(app.execute()).to.be.revertedWith('EXC3');
      });
    });
  });

  it('msgSender', async () => {
    const [sender] = await ethers.getSigners();
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('SENDER'), sender.address);
    await app.parse('var SENDER == msgSender');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('msgValue', async () => {
    const oneEth = parseEther('1');
    await app.parse('msgValue');
    await app.execute({ value: oneEth });
    await checkStackTail(stack, [oneEth]);
  });

  it('sendEth', async () => {
    const [vault, receiver] = await ethers.getSigners();
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('RECEIVER'), receiver.address);
    const twoEth = parseEther('2');

    await app.parse(`sendEth RECEIVER ${twoEth.toString()}`);

    // No ETH on the contract
    await expect(app.execute()).to.be.revertedWith('EXC3');

    // Enough ETH on the contract
    await vault.sendTransaction({ to: app.address, value: twoEth });
    await expect(await app.execute()).to.changeEtherBalance(receiver, twoEth);
    await checkStackTail(stack, [1]);
  });

  it('transfer', async () => {
    const [, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ERC20Premint');
    const dai = await Token.deploy('Token', 'TKN', parseEther('1000'));

    const oneDAI = parseEther('1');
    await dai.transfer(app.address, oneDAI);
    expect(await dai.balanceOf(app.address)).to.equal(oneDAI);

    await app['setStorageAddress(bytes32,address)'](hex4Bytes('DAI'), dai.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('RECEIVER'), receiver.address);

    await app.parse(`transfer DAI RECEIVER ${oneDAI.toString()}`);
    await app.execute();
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStackTail(stack, [1]);
  });

  it('transferVar', async () => {
    const [, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ERC20Premint');
    const dai = await Token.deploy('Token', 'TKN', parseEther('1000'));

    const oneDAI = parseEther('1');
    await dai.transfer(app.address, oneDAI);
    expect(await dai.balanceOf(app.address)).to.equal(oneDAI);

    await app['setStorageAddress(bytes32,address)'](hex4Bytes('DAI'), dai.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('RECEIVER'), receiver.address);
    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('AMOUNT'), oneDAI.toString());

    await app.parse('transferVar DAI RECEIVER AMOUNT');
    await app.execute();
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStackTail(stack, [1]);
  });

  it('transferFrom', async () => {
    const [owner, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ERC20Premint');
    const dai = await Token.deploy('Token', 'TKN', parseEther('1000'));

    const oneDAI = parseEther('1');
    await dai.connect(owner).approve(app.address, oneDAI);
    expect(await dai.allowance(owner.address, app.address)).to.equal(oneDAI);

    await app['setStorageAddress(bytes32,address)'](hex4Bytes('DAI'), dai.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('OWNER'), owner.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('RECEIVER'), receiver.address);

    await app.parse(`transferFrom DAI OWNER RECEIVER ${oneDAI.toString()}`);
    await app.execute();
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStackTail(stack, [1]);
  });

  it('transferFromVar', async () => {
    const [owner, receiver] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ERC20Premint');
    const dai = await Token.deploy('Token', 'TKN', parseEther('1000'));

    const oneDAI = parseEther('1');
    await dai.connect(owner).approve(app.address, oneDAI);
    expect(await dai.allowance(owner.address, app.address)).to.equal(oneDAI);

    await app['setStorageAddress(bytes32,address)'](hex4Bytes('DAI'), dai.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('OWNER'), owner.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('RECEIVER'), receiver.address);
    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('AMOUNT'), oneDAI.toString());

    await app.parse('transferFromVar DAI OWNER RECEIVER AMOUNT');
    await app.execute();
    expect(await dai.balanceOf(receiver.address)).to.equal(oneDAI);
    await checkStackTail(stack, [1]);
  });

  it('balance of', async () => {
    const [user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ERC20Premint');
    const dai = await Token.connect(user).deploy('Token', 'TKN', parseEther('1000'));

    await app['setStorageAddress(bytes32,address)'](hex4Bytes('DAI'), dai.address);
    await app['setStorageAddress(bytes32,address)'](hex4Bytes('USER'), user.address);

    await app.parse('balanceOf DAI USER');
    await app.execute();
    expect(await dai.balanceOf(user.address)).to.equal(parseEther('1000'));
    await checkStackTail(stack, [parseEther('1000')]);
  });
  it('balance of MSG_SENDER', async () => {
    const [, alice, bob, carl] = await ethers.getSigners();
    // Deploy test ERC20 and mint some to ctx
    const testERC20: ERC20Mintable = await (
      await ethers.getContractFactory('ERC20Mintable')
    ).deploy('Test', 'TST');
    // mint tokens to users
    await testERC20.mint(alice.address, '100');
    await testERC20.mint(bob.address, '200');
    await testERC20.mint(carl.address, '300');
    const bytes32TokenAddr = hex4Bytes('DAI');
    const bytes32msgSenderAddress = hex4Bytes('MSG_SENDER');
    await app['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const msgSenderAddress = bytes32msgSenderAddress.substring(2, 10);

    // program 'balanceOf DAI MSG_SENDER'
    await ctxProgram.setProgram(`0x2b${tokenAddress}${msgSenderAddress}`);

    // every "execute" call sets a connected address as MSG_SENDER
    await executor.connect(alice).execute(ctx.address, ctxProgram.address);
    await checkStack(stack, 1, '100');
    await executor.connect(bob).execute(ctx.address, ctxProgram.address);
    await checkStack(stack, 2, '200');
    await executor.connect(carl).execute(ctx.address, ctxProgram.address);
    await checkStack(stack, 3, '300');
  });

  describe('if-else statement', () => {
    it('simple; using `branch` keyword', async () => {
      await app.parse(
        `
        bool false
        ifelse AA BB

        branch AA {
           5 setUint256 A
        }

        branch BB {
          7 setUint256 A
        }
      `
      );
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('A'))).to.equal(7);
    });

    // TODO: fix; fails due to out of gas
    it.skip('complex; using `end` keyword', async () => {
      // TODO: check if-else test cases - it uses bool false, then bool true
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const FIVE = new Array(64).join('0') + 5;
      const SIX = new Array(64).join('0') + 6;
      const SEVEN = new Array(64).join('0') + 7;

      await app.parse(
        `${ONE}

      bool true
      bool true
      bool false
      if C
      ifelse D E
        ${TWO}
      end
      C {
        ${FIVE}
      }
      D {
        ${SIX}
      }
      E {
        ${SEVEN}
      }`
      );
      await app.execute();
      // TODO: it should be [1, 1, 7, 2]
      await checkStackTail(stack, [1, 1, 6, 2]);
    });
  });

  it('TIMESTAMP > PREV_MONTH', async () => {
    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('PREV_MONTH'), PREV_MONTH);
    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('TIMESTAMP'), lastBlockTimestamp);
    await app.parse('var TIMESTAMP > var PREV_MONTH');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('TIMESTAMP < NEXT_MONTH', async () => {
    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
    await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('TIMESTAMP'), lastBlockTimestamp);
    await app.parse('(var TIMESTAMP) < (var NEXT_MONTH)');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('block number < block timestamp', async () => {
    await app.parse('blockNumber < blockTimestamp');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  it('block number < time', async () => {
    // time is an alias for blockTimestamp
    await app.parse('blockNumber < time');
    await app.execute();
    await checkStackTail(stack, [1]);
  });

  describe('((time > init) and (time < expiry)) or (risk != true)', () => {
    const ITS_RISKY = true;
    const NOT_RISKY = false;

    async function testCase(INIT: number, EXPIRY: number, RISK: boolean, target: number) {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('INIT'), INIT);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('EXPIRY'), EXPIRY);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('TIMESTAMP'), lastBlockTimestamp);
      await app['setStorageBool(bytes32,bool)'](hex4Bytes('RISK'), RISK);

      await app.parse(
        `
        (var TIMESTAMP > var INIT)
        and
        (var TIMESTAMP < var EXPIRY)
        or
        (var RISK != bool true)
        `
      );
      await app.execute();
      await checkStackTail(stack, [target]);
    }

    // T - true, F - false
    it('((T & T) | T) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, NOT_RISKY, 1));
    it('((T & F) | T) == T', async () => testCase(PREV_MONTH, PREV_MONTH, NOT_RISKY, 1));
    it('((F & T) | T) == T', async () => testCase(NEXT_MONTH, NEXT_MONTH, NOT_RISKY, 1));
    it('((F & F) | T) == T', async () => testCase(NEXT_MONTH, PREV_MONTH, NOT_RISKY, 1));
    it('((T & T) | F) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, ITS_RISKY, 1));
    it('((T & F) | F) == F', async () => testCase(PREV_MONTH, PREV_MONTH, ITS_RISKY, 0));
    it('((F & T) | F) == F', async () => testCase(NEXT_MONTH, NEXT_MONTH, ITS_RISKY, 0));
    it('((F & F) | F) == F', async () => testCase(NEXT_MONTH, PREV_MONTH, ITS_RISKY, 0));
  });

  // TODO: fix functions in DSL & fix these tests
  describe.skip('function without parameters, without return value', () => {
    it('func SUM_OF_NUMBERS stores a value of sum', async () => {
      const input = `
        func SUM_OF_NUMBERS endf
        end

        SUM_OF_NUMBERS {
          (6 + 8) setUint256 SUM
        }
        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
    });

    it('func SUM_OF_NUMBERS with additional set variables before functions name', async () => {
      const input = `
        (2 * 250) setUint256 RES_1
        bool false
        func SUM_OF_NUMBERS endf
        end

        SUM_OF_NUMBERS {
          (6 + 8) setUint256 SUM
          bool false
          (var RES_1 / 2) setUint256 RES_2
        }

        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
      expect(await app.getStorageUint256(hex4Bytes('RES_1'))).to.equal(500);
      expect(await app.getStorageUint256(hex4Bytes('RES_2'))).to.equal(250);
    });

    it('func SUM_OF_NUMBERS with additional set variables after functions name', async () => {
      const input = `
        func SUM_OF_NUMBERS endf

        (var RES_1 * 3) setUint256 RES_2
        end

        SUM_OF_NUMBERS {
          (6 + 8) setUint256 SUM
          bool false
          (500 / 2) setUint256 RES_1
        }
        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
      expect(await app.getStorageUint256(hex4Bytes('RES_1'))).to.equal(250);
      expect(await app.getStorageUint256(hex4Bytes('RES_2'))).to.equal(750);
    });

    it('two func in the code', async () => {
      const input = `
        func SUM_OF_NUMBERS endf
        func MUL_NUMBERS endf
        end

        SUM_OF_NUMBERS {
          (11 + 22) setUint256 SUM_RESULT
        }

        MUL_NUMBERS {
          (11 * 22) setUint256 MUL_RESULT
        }
        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM_RESULT'))).to.equal(33);
      expect(await app.getStorageUint256(hex4Bytes('MUL_RESULT'))).to.equal(242);
    });

    it('two func in the code with storing used data', async () => {
      const input = `
        11 setUint256 A
        22 setUint256 B
        func SUM_OF_NUMBERS endf
        33 setUint256 C
        func MUL_NUMBERS endf
        end

        SUM_OF_NUMBERS {
          (var A + var B) setUint256 SUM_RESULT
        }

        MUL_NUMBERS {
          (var A * var B) setUint256 MUL_RESULT
        }

        44 setUint256 D
        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM_RESULT'))).to.equal(33);
      expect(await app.getStorageUint256(hex4Bytes('MUL_RESULT'))).to.equal(242);
      expect(await app.getStorageUint256(hex4Bytes('A'))).to.equal(11);
      expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
      expect(await app.getStorageUint256(hex4Bytes('C'))).to.equal(33);
      expect(await app.getStorageUint256(hex4Bytes('D'))).to.equal(0);
    });
  });

  describe('Using stored variables without a `var` opcode', () => {
    it('get sum of numbers', async () => {
      const input = `
        uint256 6 setUint256 A
        (var A + 2) setUint256 SUM
        (4 + var SUM) setUint256 SUM2
        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(8);
      expect(await app.getStorageUint256(hex4Bytes('SUM2'))).to.equal(12);
    });
  });

  // TODO: fix functions in DSL & fix these tests
  describe.skip('function with parameters, without return value', () => {
    it('func SUM_OF_NUMBERS with parameters (get uint256 variable from storage) ', async () => {
      const input = `
        6 8
        func SUM_OF_NUMBERS 2 endf
        end

        SUM_OF_NUMBERS {
          (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `;
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(14);
    });

    it('should revert if parameters provided less then amount parameters number', async () => {
      const input = `
        6
        func SUM_OF_NUMBERS 2 endf
        end

        SUM_OF_NUMBERS {
          (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `;
      await expect(app.parse(input)).to.be.revertedWith('PRP2');
    });

    it('should revert if func SUM_OF_NUMBERS provides zero parameters', async () => {
      const input = `
        6 8
        func SUM_OF_NUMBERS 0 endf
        end

        SUM_OF_NUMBERS {
          (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `;
      await expect(app.parse(input)).to.be.revertedWith('PRP1');
    });

    it('should revert if func SUM provides string instead of number for parameters', async () => {
      const input = `
        6 8
        func SUM test endf
        end

        SUM_OF_NUMBERS {
          (var SUM_1 + var SUM_2) setUint256 SUM
        }
        `;
      await expect(app.parse(input)).to.be.revertedWith('SUT3');
    });
  });

  describe('Simplified writing number in wei (setUint256)', () => {
    it('should store a simple number with 18 decimals', async () => {
      const input = '(uint256 1e18) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('1', 18));
    });

    it('should store a simple number with 18 decimals without uint256 type', async () => {
      const input = '(123e18) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
    });

    it('should store a simple number with 36 decimals', async () => {
      const input = '(uint256 1e36) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('1', 36));
    });

    it('should store a long number with 18 decimals', async () => {
      const input = '(uint256 1000000000000000e18) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(
        parseUnits('1000000000000000', 18)
      );
    });

    it('should store a simple number with 10 decimals', async () => {
      const input = '(uint256 146e10) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('146', 10));
    });

    it('should store a long number with 10 decimals', async () => {
      const input = '(uint256 1000000000000000e10) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(
        parseUnits('1000000000000000', 10)
      );
    });

    it('should store a simple number without decimals even using simplified method', async () => {
      const input = '(uint256 123e0) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(123);
    });

    it('should store a long number without decimals even using simplified method', async () => {
      const input = '(uint256 1000000000000000e0) setUint256 SUM';
      await app.parse(input);
      await app.execute();
      expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(1000000000000000);
    });

    it('should revert if tried to put several `e` symbol', async () => {
      const input = '(uint256 10000000e00000000e18) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('SUT5');
    });

    it('should revert if tried to put not `e` symbol', async () => {
      const input = '(uint256 10000000a18) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('SUT5');
    });

    it('should revert if tried to put Upper `E` symbol', async () => {
      const input = '(uint256 10000000E18) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('SUT5');
    });

    it('should revert if tried to put `0x65` symbol', async () => {
      const input = '(uint256 100000000x6518) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('SUT5');
    });

    it('should revert if base was not provided', async () => {
      const input = '(uint256 e18) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('PRS1');
    });

    it('should revert if decimals does not exist', async () => {
      const input = '(uint256 45e) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('SUT6');
    });

    it('should revert if two `e` were provided', async () => {
      const input = '(uint256 45ee6) setUint256 SUM';
      await expect(app.parse(input)).to.be.revertedWith('SUT5');
    });
  });

  describe('arrays', () => {
    const EMPTY_BYTE = '0x00';
    const EMPTY_BYTES = `0x${new Array(65).join('0')}`;
    const DECLARED_BYTES = `0x${new Array(65).join('f')}`;
    const TYPE_BYTES_UINT256 = '0x01';
    const TYPE_BYTES_ADDRESS = '0x03';

    describe('declaration', () => {
      describe('uint256', () => {
        // initially skipped
        it('number: declare an empty array with position of the next empty item', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal('0x00');

          await app.parse('declareArr uint256 NUMBERS');
          await app.execute();
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal(TYPE_BYTES_UINT256);

          // it is possible to declare the same array twice but different types
          await app.parse('declareArr address NUMBERS');
          await app.execute();
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal(TYPE_BYTES_ADDRESS);
        });

        // initially skipped
        it('number: declare an empty array even with additional code', async () => {
          await app.parse(`
            (123e18) setUint256 SUM
            declareArr uint256 NUMBERS
            22 setUint256 B
          `);
          await app.execute();
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal(TYPE_BYTES_UINT256);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
        });

        it('should declare several arrays with additional code', async () => {
          expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(EMPTY_BYTES);
          expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            (123e18) setUint256 SUM
            declareArr uint256 NUMBERS
            22 setUint256 B
            declareArr uint256 NAMES
            TIME
            declareArr uint256 ARR_TEST
            bool false
          `);
          await app.execute();
          expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(DECLARED_BYTES);
          expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(DECLARED_BYTES);

          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
        });

        describe('Simplified version', () => {
          // initially skipped
          it('declare an empty array with the position on the next empty item', async () => {
            expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
            expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal('0x00');

            await app.parse('uint256[] NUMBERS');
            await app.execute();
            expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal(TYPE_BYTES_UINT256);

            // it is possible to declare the same array twice but different types
            await app.parse('address[] NUMBERS');
            await app.execute();
            expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal(TYPE_BYTES_ADDRESS);
          });

          // initially skipped
          it('should declare an empty array even with additional code', async () => {
            await app.parse(`
              (123e18) setUint256 SUM
              uint256[] NUMBERS
              22 setUint256 B
            `);
            await app.execute();
            expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getType(hex4Bytes('NUMBERS'))).to.equal(TYPE_BYTES_UINT256);
            expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
            expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
          });

          it('should declare several arrays with additional code', async () => {
            expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
            expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(EMPTY_BYTES);
            expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(EMPTY_BYTES);
            await app.parse(`
              (123e18) setUint256 SUM
              uint256[] NUMBERS
              22 setUint256 B
              uint256[] NAMES
              TIME
              uint256[] ARR_TEST
              bool false
            `);
            await app.execute();
            expect(await app.getHead(hex4Bytes('NUMBERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(DECLARED_BYTES);
            expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(DECLARED_BYTES);

            expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
            expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
          });
        });
      });

      describe('address', () => {
        // initially skipped
        it('addr: declare an empty array with position of the next empty item', async () => {
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal('0x00');

          await app.parse('declareArr address PARTNERS');
          await app.execute();
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(TYPE_BYTES_ADDRESS);

          // it is possible to declareArr the same array twice but different types
          await app.parse('declareArr uint256 PARTNERS');
          await app.execute();
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(TYPE_BYTES_UINT256);
        });

        // initially skipped
        it('should declare an empty array even with additional code', async () => {
          await app.parse(`
            (123e18) setUint256 SUM
            declareArr address PARTNERS
            22 setUint256 B
          `);
          await app.execute();
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(TYPE_BYTES_ADDRESS);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
        });

        it('should declare several arrays with additional code', async () => {
          expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(EMPTY_BYTES);
          expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            (123e18) setUint256 SUM
            declareArr address PARTNERS
            22 setUint256 B
            declareArr address NAMES
            TIME
            declareArr address ARR_TEST
            bool false
          `);
          await app.execute();
          expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
          expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(DECLARED_BYTES);
          expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(DECLARED_BYTES);

          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
        });

        describe('Simplified version', () => {
          // initially skipped
          it('should declare an empty array with the position on the next \
empty item', async () => {
            expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
            expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTE);

            await app.parse('address[] PARTNERS');
            await app.execute();
            expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(TYPE_BYTES_ADDRESS);

            // it is possible to declareArr the same array twice but different types
            await app.parse('uint256[] PARTNERS');
            await app.execute();
            expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(TYPE_BYTES_UINT256);
          });

          // initially skipped
          it('should declare an empty array even with additional code', async () => {
            await app.parse(`
              (123e18) setUint256 SUM
              address[] PARTNERS
              22 setUint256 B
            `);
            await app.execute();
            expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
            expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getType(hex4Bytes('PARTNERS'))).to.equal(TYPE_BYTES_ADDRESS);
            expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
            expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
          });

          it('should declare several arrays with additional code', async () => {
            expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
            expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(EMPTY_BYTES);
            expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(EMPTY_BYTES);
            await app.parse(`
              (123e18) setUint256 SUM
              address[] PARTNERS
              22 setUint256 B
              address[] NAMES
              TIME
              address[] ARR_TEST
              bool false
            `);
            await app.execute();
            expect(await app.getHead(hex4Bytes('PARTNERS'))).to.equal(DECLARED_BYTES);
            expect(await app.getHead(hex4Bytes('NAMES'))).to.equal(DECLARED_BYTES);
            expect(await app.getHead(hex4Bytes('ARR_TEST'))).to.equal(DECLARED_BYTES);

            expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
            expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
          });
        });
      });
    });

    describe('Push data', () => {
      // TODO: add checks for boundary values (zero, max, bad cases)
      describe('uint256', () => {
        // initially skipped
        it('should fail if try to push an item to non exist array', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          await app.parse('insert 1345 into NUMBERS');
          await expect(app.execute()).to.be.revertedWith('EXC3');
        });

        // initially skipped
        it('should push an item to an empty array', async () => {
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          // just checking that the next value is also zero
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);

          await app.parse(`
            uint256[] NUMBERS
            insert 1345 into NUMBERS
          `);
          await app.execute();

          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(
            `0x${new Array(62).join('0')}541` // 1345
          );
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(1);
        });

        // initially skipped
        it('should push an item to the array even with additional code', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            (123e18) setUint256 SUM
            uint256[] NUMBERS
            insert 1345 into NUMBERS
            22 setUint256 B
          `);
          await app.execute();
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(1);
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(
            `0x${new Array(62).join('0')}541` // 1345
          );
        });

        // initially skipped
        it('should push several values with additional code \
(two different arrays)', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            (123e18) setUint256 SUM
            uint256[] NUMBERS
            uint256[] INDEXES
            TIME
            insert 1 into INDEXES
            insert 3 into INDEXES
            bool false
            22 setUint256 B
            insert 2 into INDEXES
            insert 1345 into NUMBERS
            insert 1465 into NUMBERS
            2 > 7
          `);
          await app.execute();
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(
            `0x${new Array(62).join('0')}541` // 1345
          );
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(
            `0x${new Array(62).join('0')}5b9` // 1465
          );

          expect(await app.getLength(hex4Bytes('INDEXES'))).to.equal(3);
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(2);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);

          expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}1`);
          expect(await app.get(1, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}3`);
          expect(await app.get(2, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}2`);
        });

        it('should push several values with additional code \
(declaration mixed with inserting)', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            (123e18) setUint256 SUM
            uint256[] NUMBERS
            TIME
            insert 1345 into NUMBERS
            uint256[] INDEXES
            insert 1 into INDEXES
            insert 1465 into NUMBERS
            insert 3 into INDEXES
            bool false
            22 setUint256 B
          `);
          await app.execute();

          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(
            `0x${new Array(62).join('0')}541` // 1345
          );
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(
            `0x${new Array(62).join('0')}5b9` // 1465
          );

          expect(await app.getLength(hex4Bytes('INDEXES'))).to.equal(2);
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(2);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);

          expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}1`);
          expect(await app.get(1, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}3`);
        });
      });

      describe('sumOf', () => {
        it('should sum several values with additional code', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            3 setUint256 SUM
            uint256[] NUMBERS
            insert 1345 into NUMBERS
            uint256[] INDEXES
            insert 1 into INDEXES
            insert 1465 into NUMBERS
            insert 3 into INDEXES
            bool false
            sumOf INDEXES
            sumOf NUMBERS
          `);
          await app.execute();
          await checkStackTail(stack, [1, 0, 4, 2810]);
        });
      });

      describe('address', () => {
        // initially skipped
        it('should fail if try to push an item to non exist array', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          await app.parse('insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS');
          await expect(app.execute()).to.be.revertedWith('EXC3');
        });

        // initially skipped
        it('should push an item to an empty array', async () => {
          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          // just checking that the next value is also zero
          expect(await app.get(1, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);

          await app.parse(`
            address[] OWNERS
            insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
          `);
          await app.execute();

          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(
            `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(1, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(1);
        });

        // initially skipped
        it('should push an item to the array even with additional code', async () => {
          expect(await app.getLength(hex4Bytes('NUMBERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(EMPTY_BYTES);
          await app.parse(`
            (123e18) setUint256 SUM
            address[] OWNERS
            insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
            22 setUint256 B
          `);
          await app.execute();
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);
          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(1);
          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(
            `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
        });

        // TODO: fix; reverted with reason string 'PRS1'
        it.skip('address: should push several values with additional code \
(two different arrays)', async () => {
          // should be zero initial values
          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(0);
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(2, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(0, hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);

          await app.parse(`
            (123e18) setUint256 SUM

            address[] OWNERS
            address[] PARTNERS

            TIME

            insert 0xe6f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
            insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into PARTNERS
            insert 0xe8f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
            insert 0xe9f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
            insert 0xf9f8a90ede3d84c7c0166bd84a4635e4675accfc into PARTNERS

            bool false
            22 setUint256 B
          `);
          await app.execute();

          expect(await app.get(0, hex4Bytes('PARTNERS'))).to.equal(
            `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(1, hex4Bytes('PARTNERS'))).to.equal(
            `0xf9f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );

          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(3);
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(2);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);

          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(
            `0xe6f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(1, hex4Bytes('OWNERS'))).to.equal(
            `0xe8f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(2, hex4Bytes('OWNERS'))).to.equal(
            `0xe9f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
        });

        // TODO: fix; reverted with reason string 'PRS1'
        it.skip('address: push several values with additional code \
(declaration mixed with inserting)', async () => {
          // should be zero initial values
          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(0);
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(2, hex4Bytes('OWNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(0, hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);

          await app.parse(`
            (123e18) setUint256 SUM

            address[] OWNERS

            TIME

            insert 0xe6f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
            insert 0xe9f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS

            address[] PARTNERS
            insert 0xe8f8a90ede3d84c7c0166bd84a4635e4675accfc into OWNERS
            insert 0xf9f8a90ede3d84c7c0166bd84a4635e4675accfc into PARTNERS
            insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into PARTNERS

            bool false
            22 setUint256 B
          `);
          await app.execute();

          expect(await app.getLength(hex4Bytes('OWNERS'))).to.equal(3);
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(2);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);

          expect(await app.get(0, hex4Bytes('PARTNERS'))).to.equal(
            `0xf9f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(1, hex4Bytes('PARTNERS'))).to.equal(
            `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );

          expect(await app.get(0, hex4Bytes('OWNERS'))).to.equal(
            `0xe6f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(1, hex4Bytes('OWNERS'))).to.equal(
            `0xe9f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(2, hex4Bytes('OWNERS'))).to.equal(
            `0xe8f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
        });
      });

      // initially skipped
      describe('mixed types(uint256 + address)', () => {
        it('should push several values with additional code \
(declaration + inserting)', async () => {
          // should be zero initial values
          expect(await app.getLength(hex4Bytes('INDEXES'))).to.equal(0);
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(0);
          expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('INDEXES'))).to.equal(EMPTY_BYTES);
          expect(await app.get(2, hex4Bytes('INDEXES'))).to.equal(EMPTY_BYTES);
          expect(await app.get(0, hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);
          expect(await app.get(1, hex4Bytes('PARTNERS'))).to.equal(EMPTY_BYTES);

          await app.parse(`
            (123e18) setUint256 SUM

            uint256[] INDEXES
            address[] PARTNERS
            TIME

            insert 1 into INDEXES
            insert 0xe8f8a90ede3d84c7c0166bd84a4635e4675accfc into PARTNERS
            bool false
            insert 3 into INDEXES
            insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into PARTNERS
            
            22 setUint256 B
          `);
          await app.execute();

          expect(await app.getLength(hex4Bytes('INDEXES'))).to.equal(2);
          expect(await app.getLength(hex4Bytes('PARTNERS'))).to.equal(2);
          expect(await app.getStorageUint256(hex4Bytes('SUM'))).to.equal(parseUnits('123', 18));
          expect(await app.getStorageUint256(hex4Bytes('B'))).to.equal(22);

          expect(await app.get(0, hex4Bytes('PARTNERS'))).to.equal(
            `0xe8f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(1, hex4Bytes('PARTNERS'))).to.equal(
            `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
          );
          expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}1`);
          expect(await app.get(1, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(64).join('0')}3`);
        });
      });
    });

    describe('Get element by index', () => {
      it('get element in arrays with different types after inserting values', async () => {
        await app.parse(`
          uint256[] NUMBERS
          address[] INDEXES
          insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 1345 into NUMBERS
          insert 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 0x17f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 1465 into NUMBERS
          get 1 NUMBERS
          get 0 NUMBERS
          get 9999 INDEXES
          get 2 INDEXES
          `);
        await app.execute();
        await checkStackTail(stack, [
          1465,
          1345,
          0,
          BigNumber.from('0x17f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000'),
        ]);
      });
    });

    describe('Get array length', () => {
      // initially skipped
      it('should return zero length of the array with uint256 type', async () => {
        await app.parse(`
          uint256[] NUMBERS
          lengthOf NUMBERS
        `);
        await app.execute();
        await checkStackTail(stack, [0]);
      });

      // initially skipped
      it('should return zero length of the array with address type', async () => {
        await app.parse(`
          address[] PARTNERS
          lengthOf PARTNERS
        `);
        await app.execute();
        await checkStackTail(stack, [0]);
      });

      // initially skipped
      it('return zero length of arrays with different types(uint256 + address)', async () => {
        await app.parse(`
          uint256[] NUMBERS
          address[] INDEXES
          lengthOf INDEXES
          lengthOf NUMBERS
        `);
        await app.execute();
        await checkStackTail(stack, [0, 0]);
      });

      // initially skipped
      it('should return length of arrays with different types \
after inserting values', async () => {
        await app.parse(`
          uint256[] NUMBERS
          address[] INDEXES
          insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 1345 into NUMBERS
          insert 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 0x17f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 1465 into NUMBERS
          lengthOf INDEXES
          lengthOf NUMBERS
        `);
        await app.execute();
        await checkStackTail(stack, [3, 2]);
      });

      it('return length of arrays with different types \
(mixed with additional code))', async () => {
        await app.parse(`
          uint256[] NUMBERS
          address[] INDEXES
          22 setUint256 B
          insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 1345 into NUMBERS
          insert 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          uint256 2
          insert 0x17f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
          insert 1465 into NUMBERS
          lengthOf INDEXES
          bool false
          lengthOf NUMBERS
        `);
        await app.execute();
        /*
          setUint256 -> 1 in the stack
          uint256 2 -> 2 in the stack
          lengthOf INDEXES -> 3 in the stack
          bool false -> 0 in the stack
          lengthOf NUMBERS -> 2 in the stack
        */
        await checkStackTail(stack, [1, 2, 3, 0, 2]);
      });
    });
  });
});
