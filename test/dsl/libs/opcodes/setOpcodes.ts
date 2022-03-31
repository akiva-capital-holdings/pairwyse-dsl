import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  SetOpcodesMock,
} from '../../../../typechain';
import { checkStack, pushToStack } from '../../../utils/utils';

describe('Set opcodes', () => {
  let StackCont: Stack__factory;
  let StackValue: StackValue__factory;
  let app: SetOpcodesMock;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  /* eslint-enable camelcase */

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');
    StackValue = await ethers.getContractFactory('StackValue');

    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy SetOpcodesMock
    app = await (
      await ethers.getContractFactory('SetOpcodesMock', {
        libraries: { SetOpcodes: setOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctx.initOpcodes();
    await ctx.setAppAddress(ctx.address);
    await ctx.setSetOpcodesAddr(setOpcodesLib.address);
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

  // describe('opAdd', () => {
  //   it('success', async () => {
  //     const ONE = new Array(64).join('0') + 1;
  //     const TWO = new Array(64).join('0') + 2;
  //     await ctx.setProgram(`0x26${ONE}${TWO}`);
  //     console.log(`0x26${ONE}${TWO}`);
  //     await app.opAdd(ctxAddr);
  //     await checkStackTailv2(StackValue, stack, [3]);
  //   });
  // });
});
