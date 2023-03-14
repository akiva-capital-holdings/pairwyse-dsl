import * as hre from 'hardhat';
import { expect } from 'chai';
/* eslint-disable camelcase */
import { parseEther } from 'ethers/lib/utils';
import {
  Stack__factory,
  ProgramContextMock,
  DSLContextMock,
  Stack,
  OtherOpcodesMock,
  ERC20Mintable,
  BaseStorage,
  OpcodeHelpersMock,
} from '../../../../../typechain-types';
import {
  checkStack,
  checkStackTail,
  hex4Bytes,
  uint256StrToHex,
  pushToStack,
} from '../../../../utils/utils';
import { deployOpcodeLibs } from '../../../../../scripts/utils/deploy.utils';

const { ethers, network } = hre;

describe.skip('Opcode helpers', () => {
  let StackCont: Stack__factory;
  /* eslint-enable camelcase */
  let app: OpcodeHelpersMock;
  let clientApp: BaseStorage;
  let ctxDSL: DSLContextMock;
  let ctxDSLAddr: string;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let stack: Stack;
  let testERC20: ERC20Mintable;
  let uint256type: string;
  let addressType: string;
  let structType: string;
  let snapshotId: number;
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let complexOpcodesLibAddr: string;
  let opcodeHelpersLibAddr: string;

  before(async () => {
    // Deploy libraries
    [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
      opcodeHelpersLibAddr,
    ] = await deployOpcodeLibs(hre);
    StackCont = await ethers.getContractFactory('Stack');
    ctxDSL = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr
    );
    ctxDSLAddr = ctxDSL.address;
    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxProgramAddr = ctxProgram.address;

    // Create Stack instance
    const stackAddr = await ctxProgram.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Deploy Storage contract to simulate another app (needed for testing loadRemote opcodes)
    clientApp = await (await ethers.getContractFactory('BaseStorage')).deploy();
    app = await (
      await ethers.getContractFactory('OpcodeHelpersMock', {
        libraries: { OpcodeHelpers: opcodeHelpersLibAddr },
      })
    ).deploy();
    // Setup
    await ctxProgram.setAppAddress(clientApp.address);

    // Deploy test ERC20 and mint some to ctxProgram
    testERC20 = await (await ethers.getContractFactory('ERC20Mintable')).deploy('Test', 'TST', 18);

    uint256type = await ctxDSL.branchCodes('declareArr', 'uint256');
    addressType = await ctxDSL.branchCodes('declareArr', 'address');
    structType = await ctxDSL.branchCodes('declareArr', 'struct');
  });

  beforeEach(async () => {
    // Make a snapshot
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('getLocalVar', () => {
    it('failure', async () => {
      await ctxProgram.setProgram('0x1a000000');
      await expect(app.getLocalVar(ctxProgramAddr, 'hey()')).to.be.revertedWith('OPH1');
    });

    it.skip('success', async () => {
      const testValue = hex4Bytes('TEST_VALUE');
      const bytes32TestVarName = hex4Bytes('BYTES32');
      const testSignature = 'getStorageBytes32(bytes32)';
      console.log({ bytes32TestVarName });

      console.log({ clientApp: clientApp.address });

      await clientApp.setStorageBytes32(bytes32TestVarName, testValue);
      console.log(await clientApp.getStorageBytes32(bytes32TestVarName));

      const bytes = bytes32TestVarName.substring(2, 10);
      console.log({ bytes, testValue });
      await ctxProgram.setProgram(`0x${bytes}`);

      const result = await app.callStatic.getLocalVar(ctxProgramAddr, testSignature);

      expect(result).to.be.equal(testValue);
    });

    // it('getLocalVar', async () => {
    //   const testValue = hex4Bytes('TEST_VALUE');
    //   const bytes32TestValueName = hex4Bytes('BYTES32');
    //   const testSignature = 'getStorageBytes32(bytes32)';

    //   await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

    //   const bytes = bytes32TestValueName.substring(2, 10);
    //   await ctxProgram.setProgram(`0x${bytes}`);

    //   const result = await app.callStatic.getLocalVar(ctxProgramAddr, testSignature);

    //   expect(result).to.be.equal(testValue);
    // });

    it('getUint256', async () => {
      const testAmount = '1000';
      await ctxProgram.setProgram(`0x${uint256StrToHex(testAmount)}`);

      const result = await app.callStatic.getUint256(ctxProgramAddr, ethers.constants.AddressZero);

      expect(result).to.be.equal(testAmount);
    });
  });
});
