import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  LogicalOpcodesMock,
} from '../../../../typechain';
// import {
//   testOpLt,
//   testOpGt,
//   testOpLe,
//   testOpGe,
//   testOpAnd,
//   testOpOr,
//   testOpXor,
// } from '../../utils/testOps';
import { pushToStack } from '../../../utils/utils';
/* eslint-enable camelcase */

describe('Logical opcodes', () => {
  // eslint-disable-next-line camelcase
  let StackCont: Stack__factory;
  // eslint-disable-next-line camelcase
  let StackValue: StackValue__factory;
  let app: LogicalOpcodesMock;
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
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy ComparatorOpcodesMock
    app = await (
      await ethers.getContractFactory('LogicalOpcodesMock', {
        libraries: { LogicalOpcodes: logicalOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctx.initOpcodes();
    await ctx.setAppAddress(ctx.address);
    await ctx.setOtherOpcodesAddr(logicalOpcodesLib.address);
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  it('opIfelse', async () => {
    const testBranchTrue = 0x01;
    const testBranchFalse = 0x02;

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

  it('opIf', async () => {
    const testBranchTrue = 0x01;

    await ctx.setProgram(`0x${testBranchTrue}`);
    await pushToStack(StackValue, ctx, StackCont, [1]);

    await app.opIf(ctxAddr);

    let pc = await ctx.pc();

    expect(pc).to.be.equal(testBranchTrue);

    await ctx.setPc(0);
    await pushToStack(StackValue, ctx, StackCont, [0]);

    await app.opIf(ctxAddr);

    pc = await ctx.pc();
    const programLength = await (await ctx.program()).length;

    expect(pc).to.be.equal(programLength);
  });

  it('opEnd', async () => {

    await ctx.setProgram('0xAAFCCEADFADCC');

    await app.opEnd(ctxAddr);

    const pc = await ctx.pc();
    const nextPc = await ctx.nextpc();
    const programLength = await (await ctx.program()).length;

    expect(pc).to.be.equal(0);
    expect(nextPc).to.be.equal(programLength);
  });

  it('getUint16', async () => {
    const testValue = 10;
    
    await ctx.setProgram(`0x${testValue}`);

    const result = await app.callStatic.getUint16(ctxAddr);

    expect(result).to.be.equal(testValue);
  });

});
