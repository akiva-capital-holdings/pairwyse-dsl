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
  let WcUsdc: ERC20Mintable;
  let snapshotId: number;
  let usdcWhale: SignerWithAddress;
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const cUSDC = '0x39AA39c021dfbaE8faC545936693aC917d5E7563';
  const USDC_WHALE = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
  const [depositRecord, withdrawRecord] = [1, 2];

  before(async () => {
    // console.log(hex4Bytes('WcUSDC'));
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

    WcUsdc = await ethers.getContractAt('ERC20Mintable', await multiTranche.wcusdc());

    await parse(multiTranche, preprocessorAddr);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('Deposit all USDC to Compound', async () => {
    await Usdc.connect(investor1).approve(multiTranche.address, '100000000'); // 100 USDC

    expect(await Usdc.balanceOf(investor1.address)).equal('100000000');
    expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    expect(await WcUsdc.balanceOf(investor1.address)).equal(0);

    expect(await multiTranche.getStorageUint256(hex4Bytes('cUSDC_BALANCE')), '0');

    // check Compound deposit before
    expect(await cUsdc.balanceOf(multiTranche.address)).equal(0);

    await multiTranche.connect(investor1).execute(depositRecord);

    // check Compound deposit after
    expect(await multiTranche.getStorageUint256(hex4Bytes('cUSDC_BALANCE'))).to.be.above(
      '440300000000'
    );
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.above(440300000000); // 8 decimals
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.below(440400000000);
    // 4403 cUsdc ~ $100
    // check an example here:
    // https://etherscan.io/tx/0x07ac9489583c105bfa0dcc49472df20899d45980243ece53b7e723a119b6686e

    expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).not.equal('0');
    expect(await Usdc.balanceOf(investor1.address)).equal(0);
    expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    expect(await WcUsdc.balanceOf(investor1.address)).to.be.above(440300000000);
  });

  it('Withdraw USDC from Compound', async () => {
    expect(await Usdc.balanceOf(investor1.address)).equal(100000000);
    expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    expect(await WcUsdc.balanceOf(investor1.address)).equal(0);

    // allow 100 USDC for multiTranche
    await Usdc.connect(investor1).approve(multiTranche.address, '100000000'); // 100 USDC

    // transfer usdc to multiTranche, receive wcusdc
    // usdc that are stored on the multiTranche contract will be deposited to compound immideatelly
    await multiTranche.connect(investor1).execute(depositRecord);

    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.above(440300000000); // 8 decimals
    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.below(440400000000);
    expect(await Usdc.balanceOf(investor1.address)).equal(0);
    expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    let currentBalance = await WcUsdc.balanceOf(investor1.address);
    expect(currentBalance).to.be.above(440300000000);

    // wait for rewards for 1000 blocks
    await mine(1000);

    // allow 4403 WcUSDC for multiTranche
    await WcUsdc.connect(investor1).approve(multiTranche.address, currentBalance);
    await multiTranche.connect(investor1).execute(withdrawRecord);

    expect(await cUsdc.balanceOf(multiTranche.address)).to.be.equal(0);
    expect(await multiTranche.getStorageUint256(hex4Bytes('W_ALLOWANCE'))).equal(currentBalance);
    expect(await Usdc.balanceOf(multiTranche.address)).equal(0);
    expect(await WcUsdc.balanceOf(investor1.address)).equal(0);

    // user can get his rewards after 1000 mined blocks
    expect(await Usdc.balanceOf(investor1.address)).to.be.above(100000300);
  });
});
