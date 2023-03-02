import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { deployOpcodeLibs, deployPreprocessor } from '../../../../../scripts/utils/deploy.utils';
import {
  IcToken,
  ERC20Mintable,
  CompoundOpcodesMock,
  TestCompoundMock,
  ProgramContextMock,
  IcTokenNative,
  Stack,
} from '../../../../../typechain-types';
import { hex4Bytes, checkStack } from '../../../../utils/utils';

const { ethers, network } = hre;
/**
 * Multi Tranche Agreement Template contract tests
 * Execute this test only using ALCHEMY_FORK with blockNumber: 16381381:
 * `yarn test --network hardhat`
 * another block can change rewards and expected results in tests
 */
describe.only('Compound opcodes', () => {
  let app: CompoundOpcodesMock;
  let clientApp: TestCompoundMock;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let snapshotId: number;
  let creator: SignerWithAddress;
  let alice: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let stack: Stack;
  let USDC: ERC20Mintable;
  let CUSDC: IcToken;
  let CETH: IcTokenNative;
  let WUSDC: ERC20Mintable;
  let USDCwhale: SignerWithAddress;
  let DSLContextAddress: string;

  before(async () => {
    [creator, alice, investor2, investor3] = await ethers.getSigners();
    const opcodeHelpersLib = await (await hre.ethers.getContractFactory('OpcodeHelpers')).deploy();
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
      compoundOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    const DSLContext = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
      compoundOpcodesLibAddr
    );
    await DSLContext.deployed();
    DSLContextAddress = DSLContext.address;

    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxProgramAddr = ctxProgram.address;
    // Create Stack instance
    const stackAddr = await ctxProgram.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);
    clientApp = await (await ethers.getContractFactory('TestCompoundMock')).deploy();
    app = await (
      await ethers.getContractFactory('CompoundOpcodesMock', {
        libraries: { CompoundOpcodes: compoundOpcodesLibAddr },
      })
    ).deploy();
    // Setup
    await ctxProgram.setAppAddress(clientApp.address);
    // Note: these addresses are for Goerli testnet
    const USDC_ADDR = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';
    const CUSDC_ADDR = '0x73506770799Eb04befb5AaE4734e58C2C624F493';
    const CETH_ADDR = '0x64078a6189Bf45f80091c6Ff2fCEe1B15Ac8dbde';
    const USDC_WHALE_ADDR = '0x75c0c372da875a4fc78e8a37f58618a6d18904e8';

    const bytes32USDC = hex4Bytes('USDC');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32USDC, USDC_ADDR);

    USDC = (await ethers.getContractAt('IERC20', USDC_ADDR)) as ERC20Mintable; // 6 decimals
    CUSDC = (await ethers.getContractAt('IcToken', CUSDC_ADDR)) as IcToken; // 8 decimals
    CETH = (await ethers.getContractAt('IcTokenNative', CETH_ADDR)) as IcTokenNative; // 8 decimals

    // send usdc to investors
    USDCwhale = await ethers.getImpersonatedSigner(USDC_WHALE_ADDR);
    expect(await USDC.balanceOf(USDC_WHALE_ADDR)).above('1000000000000000');

    let currentBalance = await USDC.balanceOf(alice.address);
    expect(currentBalance).is.equal(38e7);

    // Get rid of extra balance on investor's accounts
    await USDC.connect(USDCwhale).transfer(alice.address, 1e10);
    currentBalance = await USDC.balanceOf(alice.address);
    expect(currentBalance).is.equal(1038e7);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });
  describe('deposit', () => {
    it('native compound deposit', async () => {
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await CETH.balanceOf(app.address)).to.equal(0);
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      await alice.sendTransaction({ to: app.address, value: parseEther('10') });
      expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther('10'));
      await app
        .connect(alice)
        .opCompoundDepositNative(ctxProgramAddr, ethers.constants.AddressZero);
      // check that the user have no USDC tokens
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      // some amount of cToken that were minted to the `app`
      // TODO: check if expected value can be parsed from the contract
      // https://docs.compound.finance/v2/#networks
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
    });
  });
  describe('withdraw', () => {
    it('native compound withdrawMax', async () => {
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      await alice.sendTransaction({ to: app.address, value: parseEther('10') });
      await app
        .connect(alice)
        .opCompoundDepositNative(ctxProgramAddr, ethers.constants.AddressZero);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
      await app.connect(alice).opCompoundWithdrawMax(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await CETH.balanceOf(app.address)).to.equal(1);
      expect(await ethers.provider.getBalance(app.address)).to.equal('10000000881975243307');
    });
  });

  describe('borrow', () => {
    it('native compound borrowMax', async () => {
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      await alice.sendTransaction({ to: app.address, value: parseEther('10') });
      await app
        .connect(alice)
        .opCompoundDepositNative(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      await app.connect(alice).opCompoundBorrowMax(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(3878240263);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
    });
  });
  describe('repay', () => {
    it('native compound repayMax', async () => {
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      await alice.sendTransaction({ to: app.address, value: parseEther('10') });
      await app
        .connect(alice)
        .opCompoundDepositNative(ctxProgramAddr, ethers.constants.AddressZero);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      await app.connect(alice).opCompoundBorrowMax(ctxProgramAddr, ethers.constants.AddressZero);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await ethers.provider.getBalance(app.address)).to.equal(3878240263);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
      await app.connect(alice).opCompoundRepayMax(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
    });
  });
  describe('compound livecycle', () => {
    it('livecycle', async () => {
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await CETH.balanceOf(app.address)).to.equal(0);
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      await alice.sendTransaction({ to: app.address, value: parseEther('10') });
      expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther('10'));
      await app
        .connect(alice)
        .opCompoundDepositNative(ctxProgramAddr, ethers.constants.AddressZero);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
      await app.connect(alice).opCompoundBorrowMax(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 2, 3878240263);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      expect(await ethers.provider.getBalance(app.address)).to.equal(3878240263);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
      await app.connect(alice).opCompoundRepayMax(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296);
      await ctxProgram.setProgram(
        '0x' + '0f8a193f' // WETH
      );
      await app.connect(alice).opCompoundWithdrawMax(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await CETH.balanceOf(app.address)).to.equal(1);
      expect(await ethers.provider.getBalance(app.address)).to.equal('10000002646391712567');
    });
  });
});
