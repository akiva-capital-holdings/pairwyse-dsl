import * as hre from 'hardhat';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { network } from 'hardhat';
import { deployOpcodeLibs, deployPreprocessor } from '../../scripts/utils/deploy.utils';
import { MultiTranche, IcToken } from '../../typechain-types';
import { deployBaseMock } from '../../scripts/utils/deploy.utils.mock';
import { ERC20Mintable } from '../../typechain-types/dsl/test/ERC20Mintable.sol';
import { parse } from '../../scripts/utils/update.record';
import { hex4Bytes } from '../utils/utils';
const { ethers } = hre;
import { ONE_MONTH } from '../utils/constants';
/**
 * Multi Tranche Agreement Template contract tests
 * Execute this test only using ALCHEMY_FORK with blockNumber: 16381381:
 * `yarn test --network hardhat`
 * another block can change rewards and expected results in tests
 */
describe.only('Multi Tranche', () => {
  let creator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let anyone: SignerWithAddress;
  let preprocessorAddr: string;
  let multiTranche: MultiTranche;
  let Usdc: ERC20Mintable;
  let cUsdc: IcToken;
  let WUsdc: ERC20Mintable;
  let snapshotId: number;
  let usdcWhale: SignerWithAddress;
  let lastBlockTimestamp: number;
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const cUSDC = '0x39AA39c021dfbaE8faC545936693aC917d5E7563';
  const USDC_WHALE = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
  const [enterRecord, depositRecord, withdrawRecord, claimRecord] = [1, 2, 3, 4];

  before(async () => {
    [creator, investor1, investor2, investor3, anyone] = await ethers.getSigners();

    preprocessorAddr = await deployPreprocessor(hre);

    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    const [parserAddr, executorLibAddr] = await deployBaseMock(hre);
    const MultiTrancheCont = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executorLibAddr,
      },
    });

    const DSLContext = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr
    );
    await DSLContext.deployed();
    multiTranche = await MultiTrancheCont.deploy(parserAddr, creator.address, DSLContext.address);
    await multiTranche.deployed();

    Usdc = (await ethers.getContractAt('IERC20', USDC)) as ERC20Mintable; // 6 decimals
    cUsdc = (await ethers.getContractAt('IcToken', cUSDC)) as IcToken; // 8 decimals

    // send usdc to investors
    usdcWhale = await ethers.getImpersonatedSigner(USDC_WHALE);
    expect(await Usdc.balanceOf(USDC_WHALE)).to.be.equal('1000000000000000');

    await Usdc.connect(usdcWhale).transfer(investor1.address, parseEther('100') / 1e12);
    await Usdc.connect(usdcWhale).transfer(investor2.address, parseEther('200') / 1e12);
    await Usdc.connect(usdcWhale).transfer(investor3.address, parseEther('500') / 1e12);

    expect(await Usdc.balanceOf(investor1.address)).to.be.equal('100000000');
    expect(await Usdc.balanceOf(investor2.address)).to.be.equal('200000000');
    expect(await Usdc.balanceOf(investor3.address)).to.be.equal('500000000');

    WUsdc = await ethers.getContractAt('ERC20Mintable', await multiTranche.wusdc());

    await parse(multiTranche, preprocessorAddr);

    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    await multiTranche.setStorageUint256(
      hex4Bytes('DEPOSITS_DEADLINE'),
      lastBlockTimestamp + ONE_MONTH
    );
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it.only('Enter MultiTranche', async () => {
    await Usdc.connect(investor1).approve(multiTranche.address, parseEther('100') / 1e12);

    expect(await Usdc.balanceOf(investor1.address)).equal('100000000');
    expect(await Usdc.balanceOf(multiTranche.address)).equal(parseEther('0'));
    expect(await WUsdc.balanceOf(investor1.address)).equal(parseEther('0'));

    await multiTranche.connect(investor1).execute(enterRecord);

    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(1);

    await expect(multiTranche.connect(investor1).execute(enterRecord)).to.be.revertedWith('AGR6');

    expect(await Usdc.balanceOf(investor1.address)).equal(parseEther('0'));
    expect(await Usdc.balanceOf(multiTranche.address)).equal('100000000');
    expect(await WUsdc.balanceOf(investor1.address)).equal('100000000');
    expect(await multiTranche.getStorageUint256(hex4Bytes('WUSDC_TOTAL'))).equal('100000000');
  });

  it('Deposit all USDC to Compound', async () => {
    await Usdc.connect(usdcWhale).transfer(multiTranche.address, parseEther('1000') / 1e12);
    expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).equal('0');

    // check Compound deposit before
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0); // 8 decimals

    // can deposit only before DEPOSITS_DEADLINE
    await multiTranche.connect(anyone).execute(depositRecord);

    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(1);

    // check that it is not possible to deposit after DEPOSITS_DEADLINE
    // add 10 USDC more tokens that won't be deposited
    await Usdc.connect(usdcWhale).transfer(multiTranche.address, parseEther('10') / 1e12);
    await expect(multiTranche.connect(anyone).execute(depositRecord)).to.be.revertedWith('AGR6');

    // check Compound deposit
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.above(4403000000000); // 8 decimals
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.below(4404000000000); // 8 decimals

    // left 10 USDC tokens that won't be deposited
    expect(await Usdc.balanceOf(multiTranche.address)).equal(parseEther('10') / 1e12);
    expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).not.equal('0');
  });

  it('Withdraw USDC from Compound after 2 weeks', async () => {
    // (~ 4 block per minute = 80640 blocks)
    // 1000,00 USDC
    await Usdc.connect(usdcWhale).transfer(multiTranche.address, parseEther('1000') / 1e12);

    // deposit USDC to compound, receive cUSDC to multitranche
    await multiTranche.connect(anyone).execute(depositRecord);

    // increase blocks and time for interest
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH / 2]); // + 2 weeks
    await mine(80640);

    // can withdraw only after DEPOSIT_TIME + LOCK_TIME(2 weeks) (~ 80640 blocks)
    await multiTranche.connect(anyone).execute(withdrawRecord);

    // check Compound deposit
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0);

    // check that USDC were returnded from compound with interest
    expect(await Usdc.balanceOf(multiTranche.address)).to.be.above('1000300000'); // 1000,30 USDC
    expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).not.equal('0');
  });

  it('Claim USDC by the user after 2 weeks', async () => {
    // expect(await Usdc.balanceOf(investor1.address)).equal(100000000);
    // expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    // expect(await WUsdc.balanceOf(investor1.address)).equal(0);
    // // allow 100 USDC for multiTranche
    // await Usdc.connect(investor1).approve(multiTranche.address, '100000000'); // 100 USDC
    // // send USDC to multiTranche, receive WUSDC
    // await multiTranche.connect(investor1).execute(enterRecord);
    // expect(await Usdc.balanceOf(investor1.address)).equal(parseEther('0'));
    // expect(await Usdc.balanceOf(multiTranche.address)).equal('100000000');
    // expect(await WUsdc.balanceOf(investor1.address)).equal('100000000');
    // // transfer usdc to compound, receive cUSDC
    // await multiTranche.connect(anyone).execute(depositRecord);
    // expect(await cUsdc.balanceOf(multiTranche.address)).to.be.above(440300000000); // 8 decimals
    // expect(await cUsdc.balanceOf(multiTranche.address)).to.be.below(440400000000);
    // expect(await Usdc.balanceOf(investor1.address)).equal(0);
    // expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    // let currentBalance = await WUsdc.balanceOf(investor1.address);
    // expect(currentBalance).to.be.equal(100000000);
    // // increase blocks and time for interest
    // await ethers.provider.send('evm_increaseTime', [ONE_MONTH / 2]); // + 2 weeks
    // await mine(80640);
    // // can withdraw only after DEPOSIT_TIME + LOCK_TIME(2 weeks) (~ 80640 blocks)
    // await multiTranche.connect(anyone).execute(withdrawRecord);
    // // check Compound deposit
    // expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0);
    // // check that USDC were returnded from compound with interest
    // expect(await Usdc.balanceOf(multiTranche.address)).to.be.above('100030000'); // 1000,30 USDC
    // expect(await Usdc.balanceOf(multiTranche.address)).to.be.below('100040000'); // 1000,30 USDC
    // expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).not.equal('0');
    // expect(await multiTranche.getStorageUint256(hex4Bytes('USDC_TOTAL'))).to.be.above('100030000');
    // expect(await multiTranche.getStorageUint256(hex4Bytes('USDC_TOTAL'))).to.be.below('100040000');
    // await WUsdc.connect(investor1).approve(multiTranche.address, 100000000);
    // await multiTranche.connect(investor1).execute(claimRecord);
    // expect(await multiTranche.getStorageUint256(hex4Bytes('USER_AMOUNT'))).to.be.above('100030000');
    // expect(await multiTranche.getStorageUint256(hex4Bytes('USER_AMOUNT'))).to.be.below('100040000');
    // expect(await multiTranche.getStorageUint256(hex4Bytes('WUSDC_TOTAL'))).to.be.above('100030000');
    // expect(await multiTranche.getStorageUint256(hex4Bytes('WUSDC_TOTAL'))).to.be.below('100040000');
    // // TODO:
    // expect(await Usdc.balanceOf(investor1.address)).to.be.above('100030000');
    // expect(await Usdc.balanceOf(investor1.address)).to.be.below('100040000');
    // expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    // expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0);
    // expect(await multiTranche.getStorageUint256(hex4Bytes('W_ALLOWANCE'))).equal(currentBalance);
    // expect(await WUsdc.balanceOf(investor1.address)).equal(0);
  });

  it.skip('Scenario 1: 3 investors claims all', async () => {
    await Usdc.connect(investor1).approve(multiTranche.address, '100000000'); // 100 USDC
    await Usdc.connect(investor2).approve(multiTranche.address, '200000000'); // 200 USDC
    await Usdc.connect(investor3).approve(multiTranche.address, '500000000'); // 500 USDC

    // send USDC to multiTranche, 3 investors receive WUSDC
    await multiTranche.connect(investor1).execute(enterRecord);
    await multiTranche.connect(investor2).execute(enterRecord);
    await multiTranche.connect(investor3).execute(enterRecord);

    expect(await Usdc.balanceOf(multiTranche.address)).equal('800000000');
    expect(await WUsdc.balanceOf(investor1.address)).equal('100000000');
    expect(await WUsdc.balanceOf(investor2.address)).equal('200000000');
    expect(await WUsdc.balanceOf(investor3.address)).equal('500000000');

    // transfer usdc to compound, receive cUSDC
    await multiTranche.connect(anyone).execute(depositRecord);

    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.above(3520000000000); // 8 decimals
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.below(3530000000000);
    expect(await Usdc.balanceOf(multiTranche.address)).equal(0);

    // increase blocks and time for interest
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH / 2]); // + 2 weeks
    await mine(80640);

    // can withdraw only after DEPOSIT_TIME + LOCK_TIME(2 weeks) (~ 80640 blocks)
    await multiTranche.connect(anyone).execute(withdrawRecord);

    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0);
    let USDC_BALANCE = await Usdc.balanceOf(multiTranche.address);
    expect(USDC_BALANCE).to.be.above('800200000'); // 800,20 USDC
    expect(USDC_BALANCE).to.be.below('800300000'); // 800,30 USDC
    expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).not.equal('0');
    expect(await multiTranche.getStorageUint256(hex4Bytes('USDC_TOTAL'))).to.be.above('800200000');
    expect(await multiTranche.getStorageUint256(hex4Bytes('USDC_TOTAL'))).to.be.below('800300000');

    await WUsdc.connect(investor1).approve(multiTranche.address, 100000000);
    await WUsdc.connect(investor2).approve(multiTranche.address, 200000000);
    await WUsdc.connect(investor3).approve(multiTranche.address, 500000000);
    await multiTranche.connect(investor1).execute(claimRecord);
    await multiTranche.connect(investor2).execute(claimRecord);
    await multiTranche.connect(investor3).execute(claimRecord);

    // expect(await Usdc.balanceOf(investor1.address)).to.be.above('100030000');
    // expect(await Usdc.balanceOf(investor1.address)).to.be.below('100040000');
    // expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    // expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0);
    // expect(await multiTranche.getStorageUint256(hex4Bytes('W_ALLOWANCE'))).equal(currentBalance);
    // expect(await WUsdc.balanceOf(investor1.address)).equal(0);
  });
});
