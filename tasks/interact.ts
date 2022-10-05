import { task } from 'hardhat/config';

task('agreement:parse', 'Parse DSL code')
  .addParam('agreement', 'Agreement contract address')
  .addParam('code', 'DSL code to parse')
  .addParam('context', 'Context contract address')
  .addParam('preprocessor', 'Preprocessor contract address')
  .setAction(
    async (
      { agreement: agreementAddr, code, context: contextAddr, preprocessor: preprocessorAddr },
      hre
    ) => {
      console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

      const agreement = await hre.ethers.getContractAt('Agreement', agreementAddr);
      const tx = await agreement.parse(code, contextAddr, preprocessorAddr);
      await tx.wait();

      console.log('✅ Done ✅');
    }
  );
