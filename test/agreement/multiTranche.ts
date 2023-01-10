import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { deployOpcodeLibs, deployPreprocessor } from '../../scripts/utils/deploy.utils';
import { IERC20, MultiTranche } from '../../typechain-types';
import { deployBaseMock } from '../../scripts/utils/deploy.utils.mock';
import { ERC20Mintable } from '../../typechain-types/dsl/test/ERC20Mintable.sol';
import { parse } from '../../scripts/utils/update.record';
import { hex4Bytes } from '../utils/utils';

const { ethers } = hre;

/**
 * Multi Tranche Agreement Template contract tests
 */
describe.only('Multi Tranche', () => {
  let creator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let preprocessorAddr: string;
  let multiTranche: MultiTranche;
  let usdc: ERC20Mintable;
  let wusdc: IERC20;
  const [enterRecord, depositRecord, withdrawRecord] = [1, 2, 3];

  before(async () => {
    [creator, investor1, investor2, investor3] = await ethers.getSigners();

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

    usdc = await (await ethers.getContractFactory('ERC20Mintable')).deploy('Test', 'TST');
    await usdc.mint(investor1.address, parseEther('100'));
    await usdc.mint(investor2.address, parseEther('200'));
    await usdc.mint(investor3.address, parseEther('500'));

    wusdc = await ethers.getContractAt('IERC20', await multiTranche.wusdc());

    await multiTranche.setStorageAddress(hex4Bytes('USDC'), usdc.address);
    // await multiTranche.setStorageAddress(hex4Bytes('ME'), usdc.address);
  });

  // beforeEach(async () => {
  //   snapshotId = await network.provider.send('evm_snapshot');
  // });

  // afterEach(async () => {
  //   await network.provider.send('evm_revert', [snapshotId]);
  // });

  it.only('Step 1. Enter MultiTranche', async () => {
    await usdc.connect(investor1).approve(multiTranche.address, parseEther('100'));
    // await multiTranche.connect(investor1).execute(enterRecord);

    expect(await usdc.balanceOf(investor1.address)).equal(parseEther('100'));
    expect(await usdc.balanceOf(multiTranche.address)).equal(parseEther('0'));
    expect(await wusdc.balanceOf(investor1.address)).equal(parseEther('0'));

    await parse(multiTranche, preprocessorAddr);
    await multiTranche.connect(investor1).execute(enterRecord);

    expect(await usdc.balanceOf(investor1.address)).equal(parseEther('0'));
    expect(await usdc.balanceOf(multiTranche.address)).equal(parseEther('100'));
    expect(await wusdc.balanceOf(investor1.address)).equal(parseEther('100'));
  });
});
