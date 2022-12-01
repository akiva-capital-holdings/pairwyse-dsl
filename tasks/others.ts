import { task } from 'hardhat/config';
import { ONE_MONTH } from '../test/utils/constants';

task('impersonate-dai-holders', 'Impersonate accounts on Mainnet fork that hold DAI tokens')
  .addOptionalParam('daiHolder', 'Additional DAI holder to impersonate')
  .setAction(async ({ daiHolder }, hre) => {
    const MAINNET_DAI_ADDR = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const mainnetDaiHolders = [
      '0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8',
      '0xf977814e90da44bfa03b6295a0616a897441acec',
      '0x8eb8a3b98659cce290402893d0123abb75e3ab28',
      '0xc564ee9f21ed8a2d8e7e76c085740d5e4c5fafbe',
    ];
    if (daiHolder) mainnetDaiHolders.push(daiHolder);

    const [alice] = await hre.ethers.getSigners();

    await Promise.all(
      mainnetDaiHolders.map((holder) =>
        hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [holder],
        })
      )
    );
    const signers = mainnetDaiHolders.map((holder) => hre.ethers.provider.getSigner(holder));

    const dai = await hre.ethers.getContractAt('Token', MAINNET_DAI_ADDR);
    const userBalances = await Promise.all(
      mainnetDaiHolders.map((holder) => dai.balanceOf(holder))
    );
    await Promise.all(
      signers.map((signer, i) => dai.connect(signer).transfer(alice.address, userBalances[i]))
    );
    console.log(
      `Alice DAI balance is now ${hre.ethers.utils.formatUnits(
        (await dai.balanceOf(alice.address)).toString(),
        18
      )} DAI`
    );

    console.log('✅ Done ✅');
  });

task('advance-time', 'Advance time of a local Hardhat node')
  .addParam('by', 'By how many seconds to advance time')
  .setAction(async ({ by: advanceShift }, hre) => {
    await hre.ethers.provider.send('evm_increaseTime', [parseInt(advanceShift, 10)]);
    console.log('✅ Done ✅');
  });

task('get-next-month-timestamp', 'Shows the next month timestamp').setAction(async (_, hre) => {
  // nextMonthTimestap;
  const LAST_BLOCK_TIMESTAMP = (
    await hre.ethers.provider.getBlock(await hre.ethers.provider.getBlockNumber())
  ).timestamp;
  const nextMonthTimestap = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
  console.log(`\n\tThe next month's timestamp is ${nextMonthTimestap}`);
});
