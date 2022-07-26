import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  LogicalOpcodesMock,
} from '../../../../typechain-types';
import { checkStack, pushToStack } from '../../../utils/utils';

describe('Set opcodes', () => {
  let StackCont: Stack__factory;
  let StackValue: StackValue__factory;
  let app: LogicalOpcodesMock;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  /* eslint-enable camelcase */

  before(async () => {
    StackCont = (await ethers.getContractFactory('Stack')) as Stack__factory;
    StackValue = (await ethers.getContractFactory('StackValue')) as StackValue__factory;

    ctx = (await (await ethers.getContractFactory('Context')).deploy()) as Context;
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy LogicalOpcodesMock
    app = (await (
      await ethers.getContractFactory('LogicalOpcodesMock', {
        libraries: { LogicalOpcodes: logicalOpcodesLib.address },
      })
    ).deploy()) as LogicalOpcodesMock;

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = (await ethers.getContractAt('Stack', stackAddr)) as Stack;

    // Setup
    await ctx.initOpcodes();
    await ctx.setAppAddress(ctx.address);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  describe('opAnd', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '5']);
      await expect(app.opAnd(ctxAddr)).to.be.revertedWith('Opcodes: type mismatch');

      await pushToStack(StackValue, ctx, StackCont, ['5', '5']);
      await expect(app.opAnd(ctxAddr)).to.be.revertedWith('Opcodes: bad type');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [3, 2222]);
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [2, 0]);
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 0]);
      await app.opAnd(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opOr', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '5']);
      await expect(app.opOr(ctxAddr)).to.be.revertedWith('Opcodes: type mismatch');

      await pushToStack(StackValue, ctx, StackCont, ['5', '5']);
      await expect(app.opOr(ctxAddr)).to.be.revertedWith('Opcodes: bad type');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [3, 2222]);
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [2, 0]);
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 0]);
      await app.opOr(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opXor', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '5']);
      await expect(app.opXor(ctxAddr)).to.be.revertedWith('Opcodes: type mismatch');

      await pushToStack(StackValue, ctx, StackCont, ['5', '5']);
      await expect(app.opXor(ctxAddr)).to.be.revertedWith('Opcodes: bad type');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opXor(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [3, 2222]);
      await app.opXor(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [2, 0]);
      await app.opXor(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 0]);
      await app.opXor(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });
});
