import { ethers } from 'hardhat';
import { expect } from 'chai';
import { App, Context, Parser, Stack, StackValue__factory } from '../../../typechain';
import { hex4Bytes } from '../../utils/utils';

describe('DSL: math', () => {
  let stack: Stack;
  let ctx: Context;
  let app: App;
  let parser: Parser;
  let appAddrHex: string;
  let StackValue: StackValue__factory;
  let NEXT_MONTH: number;
  let PREV_MONTH: number;
  let lastBlockTimestamp: number;

  before(async () => {
    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;
    PREV_MONTH = lastBlockTimestamp - 60 * 60 * 24 * 30;

    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    });
    parser = await ParserCont.deploy();

    // Deploy Context & setup
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    await ctx.setComparatorOpcodesAddr(comparatorOpcodesLib.address);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLib.address);
    await ctx.setSetOpcodesAddr(setOpcodesLib.address);
    await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);

    // Deploy Application
    app = await (
      await ethers.getContractFactory('App', { libraries: { Executor: executorLib.address } })
    ).deploy(parser.address, ctx.address);
    appAddrHex = app.address.slice(2);
  });

  it('negative number error', async () => {
    await app.parse('uint256 5 - uint256 6');
    await expect(app.execute()).to.be.revertedWith('Executor: call not success');

    await app.setStorageUint256(hex4Bytes('NUM1'), 10);
    await app.setStorageUint256(hex4Bytes('NUM2'), 1000);
    await app.parse('loadLocal uint256 NUM1 - loadLocal uint256 NUM2');
    await expect(app.execute()).to.be.revertedWith('Executor: call not success');
  });

  it('division by zero error', async () => {
    await app.parse('uint256 5 / uint256 0');
    await expect(app.execute()).to.be.revertedWith('Executor: call not success');

    await app.setStorageUint256(hex4Bytes('NUM1'), 10);
    await app.setStorageUint256(hex4Bytes('NUM2'), 0);
    await app.parse('loadLocal uint256 NUM1 / loadLocal uint256 NUM2');
    await expect(app.execute()).to.be.revertedWith('Executor: call not success');
  });
});