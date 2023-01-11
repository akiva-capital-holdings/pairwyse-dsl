import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';

const { ethers, network } = hre;
/* eslint-disable camelcase */
import { CompoundUser, IERC20, IcToken } from '../../typechain-types';
import { parseEther } from 'ethers/lib/utils';
import { ONE_MONTH } from '../utils/constants';

describe('Compound User', () => {
  /* eslint-enable camelcase */
  let app: CompoundUser;
  let snapshotId: number;
  let lastBlockTimestamp: number;
  let deployer: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;
  let USDC: string;
  let cUSDC: string;
  let Usdc: IERC20;
  let cUsdc: IcToken;
  const USDC_WHALE = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
  const TOKEN_AMOUNT = parseEther('3000') / 1e12; // USDC - 6 decimals

  before(async () => {
    // >!! Important !!<, use the blockNumber: 16381381 for these expected values,
    // different block might cause different expected values
    app = await (await ethers.getContractFactory('CompoundUser')).deploy();
    USDC = await app.USDC();
    cUSDC = await app.cUSDC();
    Usdc = (await ethers.getContractAt('IERC20', USDC)) as IERC20;
    cUsdc = (await ethers.getContractAt('IcToken', cUSDC)) as IcToken; // 8 decimals
    [deployer, bob, alice] = await ethers.getSigners();
    // send usdc to alice
    const usdcWhale = await ethers.getImpersonatedSigner(USDC_WHALE);
    expect(await Usdc.balanceOf(USDC_WHALE)).to.be.equal('1000000000000000');
    await Usdc.connect(usdcWhale).transfer(alice.address, TOKEN_AMOUNT);
    await Usdc.connect(usdcWhale).transfer(bob.address, TOKEN_AMOUNT);
    expect(await Usdc.balanceOf(alice.address)).to.be.equal('3000000000');
    expect(await Usdc.balanceOf(bob.address)).to.be.equal('3000000000');

    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('user can not exchange USDC to compound token without allowance', async () => {
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    await expect(app.connect(alice).mint(TOKEN_AMOUNT)).revertedWith(
      'ERC20: transfer amount exceeds allowance'
    );
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(TOKEN_AMOUNT);
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
  });

  it('user can exchange USDC to compound token with allowance', async () => {
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await app.connect(alice).mint(TOKEN_AMOUNT);
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(app.address)).to.be.above(13209200000000); // 132092 cTokens ~ $300
    // check an example here: https://etherscan.io/tx/0x07ac9489583c105bfa0dcc49472df20899d45980243ece53b7e723a119b6686e
  });

  it('user can redeem USDC immediately after minting compound token', async () => {
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT); // 300.000000 USDC
    await app.connect(alice).mint(TOKEN_AMOUNT);
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(app.address)).to.be.above(13209200000000);

    await app.connect(alice).redeem();
    // balance of alice increased
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000000011); // 300.000011 USDC
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
  });

  it('user can redeem USDC after 1 month after minting compound tokens', async () => {
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await app.connect(alice).mint(TOKEN_AMOUNT);
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(app.address)).to.be.above(13209200000000);

    // Increase time for 10 blocks (just to have realistict time)
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // mine 1000 blocks, rewards depend on blocks, not time
    // there is per-block supply interest rate for cToken
    await mine(1000);
    // based on the article https://medium.com/compound-finance/faq-1a2636713b69
    // every ~15 seconds, alice balance will increase by (1/2102400) of the quoted interest rate

    await app.connect(alice).redeem();
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000011189); // 300.011189 USDC
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
  });

  it('user can not mint if provided amount is 0', async () => {
    expect(await Usdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);

    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await expect(app.connect(alice).mint(0)).revertedWith(
      'CompoundUser: amount should be more than 0'
    );

    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000000000); // still 300 USDC
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
  });

  it('user can not redeem if he has not minted/supplied USDC tokens yet', async () => {
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000000000); // still 300 USDC
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);

    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await expect(app.connect(alice).redeem()).revertedWith(
      'CompoundUser: the user has not supplied the USDC yet'
    );

    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000000000); // still 300 USDC
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
  });

  it('alice and bob can supply USDC and mint cTokens to the contract', async () => {
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(bob.address)).to.be.equal(0);

    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await Usdc.connect(bob).approve(app.address, TOKEN_AMOUNT);

    await app.connect(alice).mint(TOKEN_AMOUNT);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(13209286916606); // 132092.87 cTokens ~ $300

    await app.connect(bob).mint(TOKEN_AMOUNT);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(26418573783991); // 264185.74 cTokens ~ $600

    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(bob.address)).to.be.equal(0);

    expect(await Usdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await Usdc.balanceOf(bob.address)).to.be.equal(0);
  });

  it('Scenarion 1: alice and bob', async () => {
    // alice and bob supply USDC and redeem tokens after 1000 blocks (in the same time)
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await Usdc.connect(bob).approve(app.address, TOKEN_AMOUNT);
    const cTokenAlice = 13209286916606; // 132092.87 cTokens ~ $300
    const cTokenBob = 13209286867385; // 132092.87 cTokens ~ $300

    await app.connect(alice).mint(TOKEN_AMOUNT);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice);
    await app.connect(bob).mint(TOKEN_AMOUNT);
    // 264185.74 cTokens ~ $600
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice + cTokenBob);

    // Increase time for 10 blocks (just to have realistict time)
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // mine 1000 blocks, rewards depend on blocks, not time
    // there is per-block supply interest rate for cToken
    await mine(1000);

    expect(await app.info(alice.address)).to.be.equal(cTokenAlice);
    expect(await app.info(bob.address)).to.be.equal(cTokenBob);

    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice + cTokenBob);
    await app.connect(alice).redeem();
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenBob);
    await app.connect(bob).redeem();
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);

    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(bob.address)).to.be.equal(0);

    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000011200);
    expect(await Usdc.balanceOf(bob.address)).to.be.equal(3000011200);
  });

  it('Scenarion 2: alice and bob ', async () => {
    /* 
      alice and bob supply different amount of USDC.
      bob redeem tokens after 1000 blocks
      alice redeem tokens after 2000 blocks
      balances should be almost the same because alice supplied $150, and bob supplied $300
      alice was waiting for 2000 blocks, when bob was waiting only 1000
    */
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await Usdc.connect(bob).approve(app.address, TOKEN_AMOUNT);
    const cTokenAlice = 6604643458303; // 66046.43 cTokens ~ $150
    const cTokenBob = 13209262257010; // 132092.62 cTokens ~ $300

    await app.connect(alice).mint(TOKEN_AMOUNT / 2);

    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(500);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice);

    // bob supplies after 500 blocks after alice
    await app.connect(bob).mint(TOKEN_AMOUNT);
    // 264185.74 cTokens ~ $450
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice + cTokenBob);

    // Increase time for 10 blocks (just to have realistict time)
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // mine 1000 blocks, rewards depend on blocks, not time
    // there is per-block supply interest rate for cToken
    await mine(1000);

    expect(await app.info(alice.address)).to.be.equal(cTokenAlice);
    expect(await app.info(bob.address)).to.be.equal(cTokenBob);

    // bob redeem after 1000 blocks of waiting
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice + cTokenBob);
    await app.connect(bob).redeem();

    // alice redeem afteer 2000 blocks of waiting
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(500);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice);
    await app.connect(alice).redeem();
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(alice.address)).to.be.equal(0);
    expect(await cUsdc.balanceOf(bob.address)).to.be.equal(0);

    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000011195);
    expect(await Usdc.balanceOf(bob.address)).to.be.equal(3000011189);
  });

  it('Scenarion 3: alice and bob ', async () => {
    /* 
       alice and bob supply different amount of USDC.
       bob redeem tokens after 100 blocks
       alice redeem tokens after 1000 blocks
       alice supplied $300, and bob supplied $300
       rewards for alice should be 10 time more then for bob
    */
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await Usdc.connect(bob).approve(app.address, TOKEN_AMOUNT);
    const cTokenAlice = 13209286916606; // 132092.87 cTokens ~ $300
    const cTokenBob = 13209286867385; // 132092.87 cTokens ~ $300

    await app.connect(alice).mint(TOKEN_AMOUNT);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice);
    await app.connect(bob).mint(TOKEN_AMOUNT);
    // 264185.74 cTokens ~ $600
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice + cTokenBob);

    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(100);

    // bob redeem after 100 blocks of waiting
    await app.connect(bob).redeem();

    // alice redeem afteer 10000 blocks of waiting
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(900);
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(cTokenAlice);
    await app.connect(alice).redeem();
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);

    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000011212);
    expect(await Usdc.balanceOf(bob.address)).to.be.equal(3000001129);
  });

  it('Scenarion 4: alice and bob ', async () => {
    /* 
       alice and bob supply different amount of USDC.
       1. alice supplied $150
       2. bob supplied $10
       THEN 100 block passed
       3. alice supplied $150
       4. bob supplied $20
       THEN 1000 block passed
       rewards for alice should be 10 time more then for bob
    */
    await Usdc.connect(alice).approve(app.address, TOKEN_AMOUNT);
    await Usdc.connect(bob).approve(app.address, TOKEN_AMOUNT);

    await app.connect(alice).mint(150000000);
    await app.connect(bob).mint(10000000);

    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(100);

    await app.connect(alice).mint(150000000);
    await app.connect(bob).mint(20000000);

    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await mine(1000);
    await app.connect(bob).redeem();
    await app.connect(alice).redeem();
    expect(await cUsdc.balanceOf(app.address)).to.be.equal(0);
    expect(await Usdc.balanceOf(alice.address)).to.be.equal(3000001178);
    expect(await Usdc.balanceOf(bob.address)).to.be.equal(3000000115);
  });
});
