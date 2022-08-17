import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  BranchingOpcodesMock,
} from '../../../../typechain-types';
import { getBytesStringLength, pushToStack, uint256StrToHex } from '../../../utils/utils';

describe('Branching opcodes', () => {
  let StackCont: Stack__factory;
  let StackValue: StackValue__factory;
  /* eslint-enable camelcase */
  let app: BranchingOpcodesMock;
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
    const branchingOpcodesLib = await (
      await ethers.getContractFactory('BranchingOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy BranchingOpcodesMock
    app = await (
      await ethers.getContractFactory('BranchingOpcodesMock', {
        libraries: { BranchingOpcodes: branchingOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctx.initOpcodes();
    await ctx.setAppAddress(ctx.address);
    await ctx.setOtherOpcodesAddr(branchingOpcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  it('opIfelse', async () => {
    const testBranchTrue = '0001';
    const testBranchFalse = '0002';

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    await pushToStack(StackValue, ctx, StackCont, [1]);

    await app.opIfelse(ctxAddr);

    let pc = await ctx.pc();

    expect(pc).to.be.equal(testBranchTrue);

    await ctx.setPc(0);
    await pushToStack(StackValue, ctx, StackCont, [0]);

    await app.opIfelse(ctxAddr);

    pc = await ctx.pc();

    expect(pc).to.be.equal(testBranchFalse);
  });

  it('opIfelse errors branch', async () => {
    const testBranchTrue = '0001';
    const testBranchFalse = '0002';

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    const func = await app.opIfelse(ctxAddr);
    await func.wait();

    await ctx.setPc(0);
    await stack.clear();

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    await pushToStack(StackValue, ctx, StackCont, ['2121']);
    await expect(app.opIfelse(ctxAddr)).to.be.revertedWith('BOP1');
  });

  it('opIf errors branch', async () => {
    const testBranchTrue = '0001';
    const testBranchFalse = '0002';

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    const func = await app.opIf(ctxAddr);
    await func.wait();

    await ctx.setPc(0);
    await stack.clear();

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    await pushToStack(StackValue, ctx, StackCont, ['2121']);
    await expect(app.opIf(ctxAddr)).to.be.revertedWith('BOP1');
  });

  it('opIf', async () => {
    const testBranchTrue = '0001';

    await ctx.setProgram(`0x${testBranchTrue}`);
    await pushToStack(StackValue, ctx, StackCont, [1]);

    await app.opIf(ctxAddr);

    const pc = await ctx.pc();
    let nextPc = await ctx.nextpc();

    expect(pc).to.be.equal(testBranchTrue);
    // Note: opIf internally calls getUint16 and sets nextpc after check,
    //       hence there is no way to get intermediate pc.
    //       So in this case nextPc should be equal 2 because of getUint16 incrementing pc
    //       by 2 and opIf is only operation called.
    expect(nextPc).to.be.equal(2);

    await ctx.setPc(0);
    await pushToStack(StackValue, ctx, StackCont, [0]);

    await app.opIf(ctxAddr);

    nextPc = await ctx.nextpc();
    const programLength = getBytesStringLength(await ctx.program());

    expect(nextPc).to.be.equal(programLength);
  });

  it('opEnd', async () => {
    await ctx.setProgram('0xAAFCCEADFADC');

    await app.opEnd(ctxAddr);

    const pc = await ctx.pc();
    const nextPc = await ctx.nextpc();
    const programLength = getBytesStringLength(await ctx.program());

    expect(pc).to.be.equal(2);
    expect(nextPc).to.be.equal(programLength);
  });

  it('getUint16', async () => {
    const testValueUint256 = 10;
    const testValueHex = uint256StrToHex(10, 2);

    await ctx.setProgram(`0x${testValueHex}`);

    const result = await app.callStatic.getUint16(ctxAddr);

    expect(result).to.be.equal(testValueUint256);
  });

  it('opFunc errors branch', async () => {
    const testBranchTrue = '0001';
    const testBranchFalse = '0002';

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    const func = await app.opFunc(ctxAddr);
    await func.wait();

    await ctx.setPc(0);
    await stack.clear();

    await ctx.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    await pushToStack(StackValue, ctx, StackCont, ['2121']);
    await expect(app.opFunc(ctxAddr)).to.be.revertedWith('BOP1');
  });

  it('opFunc', async () => {
    const testBranchTrue = '0001';

    await ctx.setProgram(`0x${testBranchTrue}`);
    await pushToStack(StackValue, ctx, StackCont, [1]);

    await app.opFunc(ctxAddr);

    const pc = await ctx.pc();
    let nextPc = await ctx.nextpc();

    expect(pc).to.be.equal(testBranchTrue);
    // Note: opIf internally calls getUint16 and sets nextpc after check,
    //       hence there is no way to get intermediate pc.
    //       So in this case nextPc should be equal 2 because of getUint16 incrementing pc
    //       by 2 and opIf is only operation called.
    expect(nextPc).to.be.equal(2);

    await ctx.setPc(0);
    await pushToStack(StackValue, ctx, StackCont, [0]);

    await app.opFunc(ctxAddr);

    nextPc = await ctx.nextpc();
    const programLength = getBytesStringLength(await ctx.program());

    expect(nextPc).to.be.equal(programLength);
  });
});
