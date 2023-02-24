import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { deployOpcodeLibs, deployPreprocessor } from '../../../../../scripts/utils/deploy.utils';
import {
  MultiTranche,
  IcToken,
  ERC20Mintable,
  ComplexOpcodesMock,
  BaseStorage,
  ProgramContextMock,
} from '../../../../../typechain-types';
import { deployBaseMock } from '../../../../../scripts/utils/deploy.utils.mock';
import { parse } from '../../../../../scripts/utils/update.record';
import { hex4Bytes } from '../../../../utils/utils';

const { ethers, network } = hre;
/**
 * Multi Tranche Agreement Template contract tests
 * Execute this test only using ALCHEMY_FORK with blockNumber: 16381381:
 * `yarn test --network hardhat`
 * another block can change rewards and expected results in tests
 */
describe('Multi Tranche', () => {
  let app: ComplexOpcodesMock;
  let clientApp: BaseStorage;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let snapshotId: number;
  let creator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let preprocessorAddr: string;
  let USDC: ERC20Mintable;
  let CUSDC: IcToken;
  let WUSDC: ERC20Mintable;
  let USDCwhale: SignerWithAddress;
  let DSLContextAddress: string;

  before(async () => {
    [creator, investor1, investor2, investor3] = await ethers.getSigners();
    const opcodeHelpersLib = await (await hre.ethers.getContractFactory('OpcodeHelpers')).deploy();
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    const DSLContext = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr
    );
    await DSLContext.deployed();
    DSLContextAddress = DSLContext.address;

    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxProgramAddr = ctxProgram.address;
    console.log('flag1');
    // Deploy Storage contract to simulate another app (needed for testing loadRemote opcodes)
    clientApp = await (await ethers.getContractFactory('BaseStorage')).deploy();
    app = await (
      await ethers.getContractFactory('ComplexOpcodesMock', {
        libraries: { ComplexOpcodes: complexOpcodesLibAddr },
      })
    ).deploy();
    // Setup
    await ctxProgram.setAppAddress(clientApp.address);
    console.log('flag2');
    // Note: these addresses are for Goerli testnet
    const USDC_ADDR = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';
    const CUSDC_ADDR = '0x73506770799Eb04befb5AaE4734e58C2C624F493';
    const USDC_WHALE_ADDR = '0x75c0c372da875a4fc78e8a37f58618a6d18904e8';

    const bytes32USDC = hex4Bytes('USDC');
    const bytes32CUSDC = hex4Bytes('CUSDC');
    const bytes32WUSDC = hex4Bytes('WUSDC');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32USDC, USDC_ADDR);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32CUSDC, CUSDC_ADDR);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32WUSDC, USDC_WHALE_ADDR);
    console.log('flag3');
    USDC = (await ethers.getContractAt('IERC20', USDC_ADDR)) as ERC20Mintable; // 6 decimals
    CUSDC = (await ethers.getContractAt('IcToken', CUSDC_ADDR)) as IcToken; // 8 decimals
    // WUSDC = await ethers.getContractAt('ERC20Mintable', await multiTranche.WUSDC());

    // send usdc to investors
    USDCwhale = await ethers.getImpersonatedSigner(USDC_WHALE_ADDR);
    expect(await USDC.balanceOf(USDC_WHALE_ADDR)).above('1000000000000000');

    // // Get rid of extra balance on investor's accounts
    // await USDC.connect(investor1).transfer(
    //   creator.address,
    //   await USDC.balanceOf(investor1.address)
    // );
    // await USDC.connect(investor2).transfer(
    //   creator.address,
    //   await USDC.balanceOf(investor2.address)
    // );
    // await USDC.connect(investor3).transfer(
    //   creator.address,
    //   await USDC.balanceOf(investor3.address)
    // );
    console.log('flag4');
    await USDC.connect(USDCwhale).transfer(clientApp.address, parseUnits('10000', 6));
    expect(await USDC.balanceOf(clientApp.address)).to.equal(parseUnits('10000', 6));
    console.log('flag5');
  });

  beforeEach(async () => {
    // Make a snapshot
    snapshotId = await network.provider.send('evm_snapshot');
    console.log('flagbeforeeach');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
    console.log('flagaftereach');
  });

  it.only('compound deposit', async () => {
    const DEPOSIT = hex4Bytes('deposit');
    const BYTECODE_USDC = hex4Bytes('USDC');
    const BYTECODE_CUSDC = hex4Bytes('CUSDC');

    console.log(DEPOSIT);
    console.log(BYTECODE_USDC);
    console.log(BYTECODE_CUSDC);

    // '2b05eae2' + // compound
    // '48c73f6' + // deposit
    // 'd6aca1be' + // USDC
    // '0f5ad092' + // CUSDC
    console.log('starttest');
    await ctxProgram.setProgram(
      '0x' +
        'd6aca1be' + // USDC
        '0f5ad092'
    );
    console.log('setprogram');
    await app.opCompoundDeposit(ctxProgramAddr, clientApp.address);
    console.log('opcodesrun');
    expect(await CUSDC.balanceOf(clientApp.address)).to.equal(parseUnits('10000', 6));
  });
});
