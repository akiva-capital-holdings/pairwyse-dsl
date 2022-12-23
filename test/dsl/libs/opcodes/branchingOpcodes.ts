import * as hre from 'hardhat';
import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  ProgramContextMock,
  Stack,
  BaseStorage,
  BranchingOpcodesMock,
} from '../../../../typechain-types';
import { getBytesStringLength, pushToStack, uint256StrToHex } from '../../../utils/utils';

// works
describe('Branching opcodes', () => {
  let StackCont: Stack__factory;
  /* eslint-enable camelcase */
  let app: BranchingOpcodesMock;
  let ctxProgram: ProgramContextMock;
  let baseStorage: BaseStorage;
  let ctxProgramAddr: string;
  let stack: Stack;

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');

    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    baseStorage = await (await ethers.getContractFactory('BaseStorage')).deploy();
    ctxProgramAddr = ctxProgram.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await hre.ethers.getContractFactory('OpcodeHelpers')).deploy();
    const branchingOpcodesLib = await (
      await hre.ethers.getContractFactory('BranchingOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();

    // Deploy BranchingOpcodesMock
    app = await (
      await ethers.getContractFactory('BranchingOpcodesMock', {
        libraries: { BranchingOpcodes: branchingOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctxProgram.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctxProgram.setAppAddress(baseStorage.address);
  });

  afterEach(async () => {
    await ctxProgram.setPc(0);
    await stack.clear();
  });

  it('opIfelse', async () => {
    const testBranchTrue = '0001';
    const testBranchFalse = '0002';

    await ctxProgram.setProgram(`0x${testBranchTrue}${testBranchFalse}`);
    await pushToStack(ctxProgram, StackCont, [1]);

    await app.opIfelse(ctxProgramAddr, ethers.constants.AddressZero);

    let pc = await ctxProgram.pc();

    expect(pc).to.be.equal(testBranchTrue);

    await ctxProgram.setPc(0);
    await pushToStack(ctxProgram, StackCont, [0]);

    await app.opIfelse(ctxProgramAddr, ethers.constants.AddressZero);

    pc = await ctxProgram.pc();

    expect(pc).to.be.equal(testBranchFalse);
  });

  it('opIf', async () => {
    const testBranchTrue = '0001';

    await ctxProgram.setProgram(`0x${testBranchTrue}`);
    await pushToStack(ctxProgram, StackCont, [1]);

    await app.opIf(ctxProgramAddr, ethers.constants.AddressZero);

    const pc = await ctxProgram.pc();
    let nextPc = await ctxProgram.nextpc();

    expect(pc).to.be.equal(testBranchTrue);
    // Note: opIf internally calls getUint16 and sets nextpc after check,
    //       hence there is no way to get intermediate pc.
    //       So in this case nextPc should be equal 2 because of getUint16 incrementing pc
    //       by 2 and opIf is only operation called.
    expect(nextPc).to.be.equal(2);

    await ctxProgram.setPc(0);
    await pushToStack(ctxProgram, StackCont, [0]);

    await app.opIf(ctxProgramAddr, ethers.constants.AddressZero);

    nextPc = await ctxProgram.nextpc();
    const programLength = getBytesStringLength(await ctxProgram.program());

    expect(nextPc).to.be.equal(programLength);
  });

  it('opEnd', async () => {
    await ctxProgram.setProgram('0xAAFCCEADFADC');

    await app.opEnd(ctxProgramAddr, ethers.constants.AddressZero);

    const pc = await ctxProgram.pc();
    const nextPc = await ctxProgram.nextpc();
    const programLength = getBytesStringLength(await ctxProgram.program());

    expect(pc).to.be.equal(2);
    expect(nextPc).to.be.equal(programLength);
  });

  it('getUint16', async () => {
    const testValueUint256 = 10;
    const testValueHex = uint256StrToHex(10, 2);

    await ctxProgram.setProgram(`0x${testValueHex}`);

    const result = await app.callStatic.getUint16(ctxProgramAddr);

    expect(result).to.be.equal(testValueUint256);
  });

  it('opFunc', async () => {
    const testBranchTrue = '0001';

    await ctxProgram.setProgram(`0x${testBranchTrue}`);
    await pushToStack(ctxProgram, StackCont, [1]);

    await app.opFunc(ctxProgramAddr, ethers.constants.AddressZero);

    const pc = await ctxProgram.pc();
    let nextPc = await ctxProgram.nextpc();

    expect(pc).to.be.equal(testBranchTrue);
    // Note: opIf internally calls getUint16 and sets nextpc after check,
    //       hence there is no way to get intermediate pc.
    //       So in this case nextPc should be equal 2 because of getUint16 incrementing pc
    //       by 2 and opIf is only operation called.
    expect(nextPc).to.be.equal(2);

    await ctxProgram.setPc(0);
    await pushToStack(ctxProgram, StackCont, [0]);

    await app.opFunc(ctxProgramAddr, ethers.constants.AddressZero);

    nextPc = await ctxProgram.nextpc();
    const programLength = getBytesStringLength(await ctxProgram.program());

    expect(nextPc).to.be.equal(programLength);
  });
});
