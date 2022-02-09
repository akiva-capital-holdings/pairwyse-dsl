import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  ComparatorOpcodesMock,
} from '../../../typechain';
import { checkStack, pushToStack } from '../../utils/utils';
/* eslint-enable camelcase */

describe('Comparator opcodes', () => {
  // eslint-disable-next-line camelcase
  let StackCont: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let app: ComparatorOpcodesMock;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');
    StackValue = await ethers.getContractFactory('StackValue');

    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();

    // Deploy ComparatorOpcodesMock
    app = await (
      await ethers.getContractFactory('ComparatorOpcodesMock', {
        libraries: { ComparatorOpcodes: comparatorOpcodesLib.address },
      })
    ).deploy();

    // Deploy Parser
    const parser = await (
      await ethers.getContractFactory('Parser', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await parser.initOpcodes(ctxAddr);
    await ctx.setAppAddress(ctx.address);
    await ctx.setComparatorOpcodesAddr(comparatorOpcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  it('opEq', async () => {
    await pushToStack(StackValue, ctx, StackCont, [1, 1]);
    await app.opEq(ctxAddr);
    await checkStack(StackValue, stack, 1, 1);

    await stack.clear();
    await ctx.setPc(0);

    await pushToStack(StackValue, ctx, StackCont, [1, 2]);
    await app.opEq(ctxAddr);
    await checkStack(StackValue, stack, 1, 0);
  });

  it('opNotEq', async () => {
    await pushToStack(StackValue, ctx, StackCont, [1, 1]);
    await app.opNotEq(ctxAddr);
    await checkStack(StackValue, stack, 1, 0);

    await stack.clear();
    await ctx.setPc(0);

    await pushToStack(StackValue, ctx, StackCont, [1, 2]);
    await app.opNotEq(ctxAddr);
    await checkStack(StackValue, stack, 1, 1);
  });
});
