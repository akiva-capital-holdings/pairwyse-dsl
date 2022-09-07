import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import { Stack__factory, Context, Stack, LogicalOpcodesMock } from '../../../../typechain-types';
import { checkStack, pushToStack } from '../../../utils/utils';

describe('Logical opcodes', () => {
  let StackCont: Stack__factory;
  let app: LogicalOpcodesMock;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  /* eslint-enable camelcase */

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');

    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy LogicalOpcodesMock
    app = await (
      await ethers.getContractFactory('LogicalOpcodesMock', {
        libraries: { LogicalOpcodes: logicalOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctx.setAppAddress(ctx.address);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  describe('opAnd', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opAnd(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [3, 2222]);
      await app.opAnd(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2, 0]);
      await app.opAnd(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 0]);
      await app.opAnd(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 1]);
      await app.opAnd(ctxAddr);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opOr', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opOr(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [3, 2222]);
      await app.opOr(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2, 0]);
      await app.opOr(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 0]);
      await app.opOr(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 2]);
      await app.opOr(ctxAddr);
      await checkStack(stack, 1, 1);
    });
  });

  describe('opXor', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opXor(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [3, 2222]);
      await app.opXor(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2222, 3]);
      await app.opXor(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2, 0]);
      await app.opXor(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 0]);
      await app.opXor(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 2]);
      await app.opXor(ctxAddr);
      await checkStack(stack, 1, 1);
    });
  });

  describe('opAdd', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opAdd(ctxAddr);
      await checkStack(stack, 1, 2);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [3, 2222]);
      await app.opAdd(ctxAddr);
      await checkStack(stack, 1, 2225);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2, 0]);
      await app.opAdd(ctxAddr);
      await checkStack(stack, 1, 2);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 0]);
      await app.opAdd(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 2]);
      await app.opAdd(ctxAddr);
      await checkStack(stack, 1, 2);
    });
  });

  describe('opSub', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opSub(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2222, 3]);
      await app.opSub(ctxAddr);
      await checkStack(stack, 1, 2219);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2, 0]);
      await app.opSub(ctxAddr);
      await checkStack(stack, 1, 2);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 0]);
      await app.opSub(ctxAddr);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opMul', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opMul(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2222, 3]);
      await app.opMul(ctxAddr);
      await checkStack(stack, 1, 6666);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [2, 0]);
      await app.opMul(ctxAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [0, 0]);
      await app.opMul(ctxAddr);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opDiv', () => {
    it('success', async () => {
      await pushToStack(ctx, StackCont, [1, 1]);
      await app.opDiv(ctxAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [3333, 3]);
      await app.opDiv(ctxAddr);
      await checkStack(stack, 1, 1111);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(ctx, StackCont, [5, 2]);
      await app.opDiv(ctxAddr);
      await checkStack(stack, 1, 2);
    });
  });
});
