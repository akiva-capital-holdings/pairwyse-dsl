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
  Interactor,
  ProgramContextMock,
  IcTokenNative,
  Stack,
} from '../../../../../typechain-types';
import { hex4Bytes, checkStack, uint256StrToHex } from '../../../../utils/utils';

const { ethers, network } = hre;
/**
 * Multi Tranche Agreement Template contract tests
 * Execute this test only using ALCHEMY_FORK with blockNumber: 16381381:
 * `yarn test --network hardhat`
 * another block can change rewards and expected results in tests
 */
describe.only('Compound opcodes', () => {
  let app: CompoundOpcodesMock;
  let interactor: Interactor;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let snapshotId: number;
  let creator: SignerWithAddress;
  let alice: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let stack: Stack;
  let DAI: ERC20Mintable;
  let USDC: ERC20Mintable;
  let CUSDC: IcToken;
  let CDAI: IcToken;
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
    interactor = await (await ethers.getContractFactory('Interactor')).deploy();
    app = await (
      await ethers.getContractFactory('CompoundOpcodesMock', {
        libraries: { CompoundOpcodes: compoundOpcodesLibAddr },
      })
    ).deploy();
    // Setup
    await ctxProgram.setAppAddress(interactor.address);
    // Note: these addresses are for Goerli testnet
    const USDC_ADDR = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';
    const DAI_ADDR = '0x2899a03ffDab5C90BADc5920b4f53B0884EB13cC';
    const CDAI_ADDR = '0x0545a8eaF7ff6bB6F708CbB544EA55DBc2ad7b2a';
    const CUSDC_ADDR = '0x73506770799Eb04befb5AaE4734e58C2C624F493';
    const CETH_ADDR = '0x64078a6189Bf45f80091c6Ff2fCEe1B15Ac8dbde';
    const USDC_WHALE_ADDR = '0x75c0c372da875a4fc78e8a37f58618a6d18904e8';

    const bytes32USDC = hex4Bytes('USDC');

    await interactor['setStorageAddress(bytes32,address)'](bytes32USDC, USDC_ADDR);

    DAI = (await ethers.getContractAt('IERC20', DAI_ADDR)) as ERC20Mintable; // 18 decimals
    USDC = (await ethers.getContractAt('IERC20', USDC_ADDR)) as ERC20Mintable; // 6 decimals
    CDAI = (await ethers.getContractAt('IcToken', CDAI_ADDR)) as IcToken; // 8 decimals
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

    it('simple token compound deposit', async () => {
      await ctxProgram.setProgram(
        '0x' + 'd6aca1be' // USDC
      );
      expect(await CETH.balanceOf(app.address)).to.equal(0);
      expect(await USDC.balanceOf(app.address)).to.equal(0);
      await USDC.connect(USDCwhale).transfer(app.address, '100000000'); // 100 USDC
      expect(await USDC.balanceOf(app.address)).to.equal('100000000');
      await app.connect(alice).opCompoundDeposit(ctxProgramAddr, ethers.constants.AddressZero);
      // check that the user have no USDC tokens
      expect(await USDC.balanceOf(app.address)).to.equal(0);
      // some amount of cToken that were minted to the `app`
      // TODO: check if expected value can be parsed from the contract
      // https://docs.compound.finance/v2/#networks
      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
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
    // TODO: need to create/find proper formula to execute opcode with Safe Max value (80%)
    // using all cTokens balances for the user

    const borrowAmount = '60000'; // USDC
    it('supply ETH borrow ETH', async () => {
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
        '0x' +
          '0f8a193f' + // make collateral WETH
          '0f8a193f' + // WETH (marked native) - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(60000);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296); // did not changed
    });

    it('supply ETH borrow USDC', async () => {
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
        '0x' +
          '0f8a193f' + // make collateral WETH
          'd6aca1be' + // USDC - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await USDC.balanceOf(app.address)).to.equal(60000);

      // check if it is possible to borow twice the same token
      await ctxProgram.setProgram(
        '0x' +
          '0f8a193f' + // make collateral WETH
          'd6aca1be' + // USDC - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);
      // amount increased
      expect(await USDC.balanceOf(app.address)).to.equal(120000);
      expect(await CETH.balanceOf(app.address)).to.equal(48478003296); // did not changed
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
    });

    it('supply USDC borrow ETH', async () => {
      const _borrowAmount = parseEther('0.01'); // 1e17
      const borrowAmount = new Array(65 - 17).join('0') + _borrowAmount;
      await ctxProgram.setProgram(
        '0x' + 'd6aca1be' // USDC
      );
      await USDC.connect(USDCwhale).transfer(app.address, '100000000'); // 100 USDC
      await app.connect(alice).opCompoundDeposit(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(0);
      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
      expect(await USDC.balanceOf(app.address)).to.equal(0);

      await ctxProgram.setProgram(
        '0x' +
          'd6aca1be' + // make collateral USDC
          '0f8a193f' + // ETH - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount in ETH
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await ethers.provider.getBalance(app.address)).to.equal(_borrowAmount);
      // did not change
      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
      expect(await CETH.balanceOf(app.address)).to.equal(0);
      expect(await USDC.balanceOf(app.address)).to.equal(0);

      // check if it is possible to borow twice the same token
      await ctxProgram.setProgram(
        '0x' +
          'd6aca1be' + // make collateral USDC
          '0f8a193f' + // ETH - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount in ETH
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);
      // increased two times as we have the same parameters
      expect(await ethers.provider.getBalance(app.address)).to.equal(_borrowAmount.mul(2));
      // did not change
      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
      expect(await CETH.balanceOf(app.address)).to.equal(0);
      expect(await USDC.balanceOf(app.address)).to.equal(0);
    });

    it('supply USDC borrow DAI', async () => {
      await ctxProgram.setProgram(
        '0x' + 'd6aca1be' // USDC
      );
      await USDC.connect(USDCwhale).transfer(app.address, '100000000'); // 100 USDC
      await app.connect(alice).opCompoundDeposit(ctxProgramAddr, ethers.constants.AddressZero);

      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
      expect(await CDAI.balanceOf(app.address)).to.equal(0);
      expect(await USDC.balanceOf(app.address)).to.equal(0);
      expect(await DAI.balanceOf(app.address)).to.equal(0);

      await ctxProgram.setProgram(
        '0x' +
          'd6aca1be' + // make collateral USDC
          'a5e92f3e' + // DAI - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);

      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
      expect(await CDAI.balanceOf(app.address)).to.equal(0);
      expect(await USDC.balanceOf(app.address)).to.equal(0);
      expect(await DAI.balanceOf(app.address)).to.equal(60000);

      // check if it is possible to borow twice the same token
      await ctxProgram.setProgram(
        '0x' +
          'd6aca1be' + // make collateral USDC
          'a5e92f3e' + // DAI - borrow token
          `${uint256StrToHex(borrowAmount)}` // borrow amount
      );
      await app.connect(alice).opCompoundBorrow(ctxProgramAddr, ethers.constants.AddressZero);
      // increased two times as we have the same parameters
      expect(await CUSDC.balanceOf(app.address)).to.equal(499443807273);
      expect(await CDAI.balanceOf(app.address)).to.equal(0);
      expect(await USDC.balanceOf(app.address)).to.equal(0);
      expect(await DAI.balanceOf(app.address)).to.equal(120000);
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
