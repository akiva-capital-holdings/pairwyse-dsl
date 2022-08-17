import { ethers } from 'hardhat';
import { expect } from 'chai';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  ComparisonOpcodesMock,
} from '../../../../typechain-types';
import { checkStack, pushToStack } from '../../../utils/utils';
/* eslint-enable camelcase */

describe('Comparison opcodes', () => {
  // eslint-disable-next-line camelcase
  let StackCont: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let app: ComparisonOpcodesMock;
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
    const comparisonOpcodesLib = await (
      await ethers.getContractFactory('ComparisonOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy ComparisonOpcodesMock
    app = await (
      await ethers.getContractFactory('ComparisonOpcodesMock', {
        libraries: { ComparisonOpcodes: comparisonOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctx.initOpcodes();
    await ctx.setAppAddress(ctx.address);
    await ctx.setComparisonOpcodesAddr(comparisonOpcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  describe('opEq', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '1']);
      await expect(app.opEq(ctxAddr)).to.be.revertedWith('OP4');

      await pushToStack(StackValue, ctx, StackCont, ['1', '1']);
      await expect(app.opEq(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opEq(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 2]);
      await app.opEq(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opNotEq', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '1']);
      await expect(app.opNotEq(ctxAddr)).to.be.revertedWith('OP4');

      await pushToStack(StackValue, ctx, StackCont, ['1', '1']);
      await expect(app.opNotEq(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
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

  describe('opLt', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '1']);
      await expect(app.opLt(ctxAddr)).to.be.revertedWith('OP4');

      await pushToStack(StackValue, ctx, StackCont, ['1', '1']);
      await expect(app.opLt(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opLt(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 2]);
      await app.opLt(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [2, 1]);
      await app.opLt(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opNot', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, ['1']);
      await expect(app.opNot(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 2, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 1]);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 2, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 0]);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 2, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1]);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opSwap', () => {
    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opSwap(ctxAddr);
      await checkStack(StackValue, stack, 2, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0]);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 1]);
      await app.opNot(ctxAddr);
      await checkStack(StackValue, stack, 2, 0);
    });
  });

  describe('opGt', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '1']);
      await expect(app.opGt(ctxAddr)).to.be.revertedWith('OP4');

      await pushToStack(StackValue, ctx, StackCont, ['1', '1']);
      await expect(app.opGt(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [2, 1]);
      await app.opGt(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 2]);
      await app.opGt(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opGt(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('opLe', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '1']);
      await expect(app.opLe(ctxAddr)).to.be.revertedWith('OP4');

      await pushToStack(StackValue, ctx, StackCont, ['1', '1']);
      await expect(app.opLe(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [2, 1]);
      await app.opLe(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 2]);
      await app.opLe(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opLe(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 0]);
      await app.opLe(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 1]);
      await app.opLe(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe('opGe', () => {
    it('errors', async () => {
      await pushToStack(StackValue, ctx, StackCont, [1, '1']);
      await expect(app.opGe(ctxAddr)).to.be.revertedWith('OP4');

      await pushToStack(StackValue, ctx, StackCont, ['1', '1']);
      await expect(app.opGe(ctxAddr)).to.be.revertedWith('OP2');
    });

    it('success', async () => {
      await pushToStack(StackValue, ctx, StackCont, [2, 1]);
      await app.opGe(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 2]);
      await app.opGe(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 1]);
      await app.opGe(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [1, 0]);
      await app.opGe(ctxAddr);
      await checkStack(StackValue, stack, 1, 1);

      await stack.clear();
      await ctx.setPc(0);

      await pushToStack(StackValue, ctx, StackCont, [0, 1]);
      await app.opGe(ctxAddr);
      await checkStack(StackValue, stack, 1, 0);
    });
  });
});
