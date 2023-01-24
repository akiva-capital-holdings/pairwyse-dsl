import * as hre from 'hardhat';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { deployOpcodeLibs, deployPreprocessor } from '../../scripts/utils/deploy.utils';
import { MultiTranche, IcToken } from '../../typechain-types';
import { deployBaseMock } from '../../scripts/utils/deploy.utils.mock';
import { ERC20Mintable } from '../../typechain-types/dsl/test/ERC20Mintable.sol';
import { parse } from '../../scripts/utils/update.record';
import { hex4Bytes } from '../utils/utils';
import { ONE_MONTH } from '../utils/constants';

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
  let USDC: ERC20Mintable;
  let CUSDC: IcToken;
  let WUSDC: ERC20Mintable;
  let USDCwhale: SignerWithAddress;
  const USDC_ADDR = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';
  const CUSDC_ADDR = '0x73506770799Eb04befb5AaE4734e58C2C624F493';
  const USDC_WHALE_ADDR = '0x75c0c372da875a4fc78e8a37f58618a6d18904e8';
  const [enterRecord, depositAllRecord, withdrawRecord, claimRecord] = [1, 2, 3, 4];

  before(async () => {
    [creator, investor1, investor2, investor3, anyone] = await ethers.getSigners();

    preprocessorAddr = await deployPreprocessor(hre);

    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    const DSLContext = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr
    );
    await DSLContext.deployed();

    const [parserAddr, executorLibAddr] = await deployBaseMock(hre);

    const MultiTrancheCont = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executorLibAddr,
      },
    });
    multiTranche = await MultiTrancheCont.deploy(parserAddr, creator.address, DSLContext.address);
    await multiTranche.deployed();

    USDC = (await ethers.getContractAt('IERC20', USDC_ADDR)) as ERC20Mintable; // 6 decimals
    CUSDC = (await ethers.getContractAt('IcToken', CUSDC_ADDR)) as IcToken; // 8 decimals

    // send usdc to investors
    USDCwhale = await ethers.getImpersonatedSigner(USDC_WHALE_ADDR);
    expect(await USDC.balanceOf(USDC_WHALE_ADDR)).above('1000000000000000');

    // Get rid of extra balance on investor's accounts
    await USDC.connect(investor1).transfer(
      creator.address,
      await USDC.balanceOf(investor1.address)
    );
    await USDC.connect(investor2).transfer(
      creator.address,
      await USDC.balanceOf(investor2.address)
    );
    await USDC.connect(investor3).transfer(
      creator.address,
      await USDC.balanceOf(investor3.address)
    );

    await USDC.connect(USDCwhale).transfer(investor1.address, parseUnits('100', 6));
    await USDC.connect(USDCwhale).transfer(investor2.address, parseUnits('200', 6));
    await USDC.connect(USDCwhale).transfer(investor3.address, parseUnits('100000000', 6));

    expect(await USDC.balanceOf(investor1.address)).to.equal(parseUnits('100', 6));
    expect(await USDC.balanceOf(investor2.address)).to.equal(parseUnits('200', 6));
    expect(await USDC.balanceOf(investor3.address)).to.equal(parseUnits('100000000', 6));

    WUSDC = await ethers.getContractAt('ERC20Mintable', await multiTranche.wusdc());

    await parse(multiTranche, preprocessorAddr);

    do {
      await multiTranche.parse(preprocessorAddr);
    } while ((await multiTranche.parseFinished()) === false);
  });

  describe('Lifecycle', () => {
    it('Enter', async () => {
      await USDC.connect(investor1).approve(multiTranche.address, parseUnits('100', 6));
      await USDC.connect(investor2).approve(multiTranche.address, parseUnits('200', 6));
      await USDC.connect(investor3).approve(multiTranche.address, parseUnits('100000000', 6));

      expect(await USDC.balanceOf(investor1.address)).equal(parseUnits('100', 6));
      expect(await USDC.balanceOf(investor2.address)).equal(parseUnits('200', 6));
      expect(await USDC.balanceOf(investor3.address)).equal(parseUnits('100000000', 6));
      expect(await WUSDC.balanceOf(investor1.address)).equal(parseEther('0'));
      expect(await WUSDC.balanceOf(investor2.address)).equal(parseEther('0'));
      expect(await WUSDC.balanceOf(investor3.address)).equal(parseEther('0'));
      expect(await USDC.balanceOf(multiTranche.address)).equal(parseEther('0'));

      await multiTranche.connect(investor1).execute(enterRecord);
      await multiTranche.connect(investor2).execute(enterRecord);
      await multiTranche.connect(investor3).execute(enterRecord);

      expect(await USDC.balanceOf(investor1.address)).equal(parseEther('0'));
      expect(await USDC.balanceOf(investor2.address)).equal(parseEther('0'));
      expect(await USDC.balanceOf(investor3.address)).equal(parseEther('0'));
      expect(await WUSDC.balanceOf(investor1.address)).equal(parseUnits('100', 6));
      expect(await WUSDC.balanceOf(investor2.address)).equal(parseUnits('200', 6));
      expect(await WUSDC.balanceOf(investor3.address)).equal(parseUnits('100000000', 6));
      expect(await USDC.balanceOf(multiTranche.address)).equal(parseUnits('100000300', 6));
    });

    it('Deposit', async () => {
      expect(await USDC.balanceOf(multiTranche.address)).equal(parseUnits('100000300', 6));
      expect(await CUSDC.balanceOf(multiTranche.address)).to.be.equal(0); // 8 decimals

      await multiTranche.connect(anyone).execute(depositAllRecord);
      const CUSDCBal = await CUSDC.balanceOf(multiTranche.address);

      expect(await CUSDC.balanceOf(multiTranche.address)).equal(CUSDCBal);
      expect(await USDC.balanceOf(multiTranche.address)).equal(0);
    });

    it('Withdraw', async () => {
      expect(await USDC.balanceOf(investor1.address)).equal(0);
      expect(await USDC.balanceOf(investor2.address)).equal(0);
      expect(await USDC.balanceOf(investor3.address)).equal(0);
      expect(await WUSDC.balanceOf(investor1.address)).equal(parseUnits('100', 6));
      expect(await WUSDC.balanceOf(investor2.address)).equal(parseUnits('200', 6));
      expect(await WUSDC.balanceOf(investor3.address)).equal(parseUnits('100000000', 6));

      await WUSDC.connect(investor1).approve(multiTranche.address, parseUnits('100', 6));
      await WUSDC.connect(investor2).approve(multiTranche.address, parseUnits('200', 6));
      await WUSDC.connect(investor3).approve(multiTranche.address, parseUnits('100000000', 6));

      // Investor 1 withdraws
      await multiTranche.connect(investor1).execute(withdrawRecord);
      expect(await USDC.balanceOf(investor1.address)).equal(parseUnits('100', 6).sub(1));
      expect(await WUSDC.balanceOf(investor1.address)).equal(0);

      // Investor 3 withdraws
      await multiTranche.connect(investor3).execute(withdrawRecord);
      expect(await USDC.balanceOf(investor3.address)).equal(parseUnits('100000000', 6).sub(1));
      expect(await WUSDC.balanceOf(investor3.address)).equal(0);

      // Investor 2 withdraws
      await multiTranche.connect(investor2).execute(withdrawRecord);
      expect(await USDC.balanceOf(investor2.address)).equal(parseUnits('200', 6).sub(1));
      expect(await WUSDC.balanceOf(investor2.address)).equal(0);
    });
  });

  it.skip('Scenario 1: 3 investors claims all', async () => {
    await USDC.connect(investor1).approve(multiTranche.address, '100000000'); // 100 USDC
    await USDC.connect(investor2).approve(multiTranche.address, '200000000'); // 200 USDC
    await USDC.connect(investor3).approve(multiTranche.address, '500000000'); // 500 USDC

    // send USDC to multiTranche, 3 investors receive WUSDC
    await multiTranche.connect(investor1).execute(enterRecord);
    await multiTranche.connect(investor2).execute(enterRecord);
    await multiTranche.connect(investor3).execute(enterRecord);

    expect(await USDC.balanceOf(multiTranche.address)).equal('800000000');
    expect(await WUSDC.balanceOf(investor1.address)).equal('100000000');
    expect(await WUSDC.balanceOf(investor2.address)).equal('200000000');
    expect(await WUSDC.balanceOf(investor3.address)).equal('500000000');

    // transfer usdc to compound, receive CUSDC
    await multiTranche.connect(anyone).execute(depositAllRecord);

    expect(await CUSDC.balanceOf(multiTranche.address)).to.be.above(3520000000000); // 8 decimals
    expect(await CUSDC.balanceOf(multiTranche.address)).to.be.below(3530000000000);
    expect(await USDC.balanceOf(multiTranche.address)).equal(0);

    // increase blocks and time for interest
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH / 2]); // + 2 weeks
    await mine(80640);

    // can withdraw only after DEPOSIT_TIME + LOCK_TIME(2 weeks) (~ 80640 blocks)
    await multiTranche.connect(anyone).execute(withdrawRecord);

    expect(await CUSDC.balanceOf(multiTranche.address)).to.be.equal(0);
    const USDC_BALANCE = await USDC.balanceOf(multiTranche.address);
    expect(USDC_BALANCE).to.be.above('800200000'); // 800,20 USDC
    expect(USDC_BALANCE).to.be.below('800300000'); // 800,30 USDC
    expect(await multiTranche.getStorageUint256(hex4Bytes('DEPOSIT_TIME'))).not.equal('0');
    expect(await multiTranche.getStorageUint256(hex4Bytes('USDC_TOTAL'))).to.be.above('800200000');
    expect(await multiTranche.getStorageUint256(hex4Bytes('USDC_TOTAL'))).to.be.below('800300000');

    await WUSDC.connect(investor1).approve(multiTranche.address, 100000000);
    await WUSDC.connect(investor2).approve(multiTranche.address, 200000000);
    await WUSDC.connect(investor3).approve(multiTranche.address, 500000000);
    await multiTranche.connect(investor1).execute(claimRecord);
    await multiTranche.connect(investor2).execute(claimRecord);
    await multiTranche.connect(investor3).execute(claimRecord);

    // expect(await USDC.balanceOf(investor1.address)).to.be.above('100030000');
    // expect(await USDC.balanceOf(investor1.address)).to.be.below('100040000');
    // expect(await USDC.balanceOf(multiTranche.address)).equal(0);
    // expect(await CUSDC.balanceOf(multiTranche.address)).to.be.equal(0);
    // expect(await multiTranche.getStorageUint256(hex4Bytes('W_ALLOWANCE'))).equal(currentBalance);
    // expect(await WUSDC.balanceOf(investor1.address)).equal(0);
  });
});
