import { parseEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { hex4Bytes, setupGovernance } from '../scripts/utils/interact.utils';

task('agreement:parse', 'Parse DSL code')
  .addParam('agreement', 'Agreement contract address')
  .addParam('code', 'DSL code to parse')
  .addParam('preprocessor', 'Preprocessor contract address')
  .setAction(async ({ agreement: agreementAddr, code, preprocessor: preprocessorAddr }, hre) => {
    console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

    const agreement = await hre.ethers.getContractAt('Agreement', agreementAddr);
    const tx = await agreement.parse(code, preprocessorAddr);
    await tx.wait();

    console.log('✅ Done ✅');
  });

task('top-up:agreement', 'Top up Agreement contract')
  .addParam('agreement', 'Agreement contract address')
  .addParam('amount', 'Top up amount in ETH')
  .setAction(async ({ agreement: agreementAddr, amount: ethAmount }, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    console.log(`Sender address ${signer.address}`);
    await signer.sendTransaction({ to: agreementAddr, value: parseEther(ethAmount) });

    console.log('✅ Done ✅');
  });

task('setup:governance', 'Setup Governance contract')
  .addParam('parser', 'Parser contract address')
  .addParam('preprocessor', 'Preprocessor contract address')
  .addParam('governance', 'Governance contract address')
  .setAction(
    async ({ parser: parserAddr, preprocessor: preprAddr, governance: governanceAddr }, hre) => {
      console.log(`Sender address ${(await hre.ethers.getSigners())[0].address}`);

      const parser = await hre.ethers.getContractAt('Parser', parserAddr);
      const governance = await hre.ethers.getContractAt('Governance', governanceAddr);
      await setupGovernance(parser, preprAddr, governance);

      console.log('✅ Done ✅');
    }
  );

task('transfer-ownership:agreement', 'Transfer Agreement contract ownership')
  .addParam('agreement', 'Agreement contract address')
  .addParam('newOwner', 'New owner of Agreement contract')
  .setAction(async ({ agreement: agreementAddr, newOwner: newOwnerAddr }, hre) => {
    console.log(`Sender address ${(await hre.ethers.getSigners())[0].address}`);

    const agreement = await hre.ethers.getContractAt('Agreement', agreementAddr);
    await agreement.transferOwnership(newOwnerAddr);

    console.log('✅ Done ✅');
  });

task('set:number', 'Set variable of type uint256 in the provided Agreement or Governance contract')
  .addParam('target', 'Target contract address')
  .addParam('name', 'Variable name to set')
  .addParam('value', 'Variable value to set')
  .setAction(async ({ target: targetAddr, name, value }, hre) => {
    console.log(`Sender address ${(await hre.ethers.getSigners())[0].address}`);

    const target = await hre.ethers.getContractAt('Agreement', targetAddr);
    await target.setStorageUint256(hex4Bytes(hre, name), value);

    console.log('✅ Done ✅');
  });

task('set:address', 'Set variable of type address in the provided Agreement or Governance contract')
  .addParam('target', 'Target contract address')
  .addParam('name', 'Variable name to set')
  .addParam('value', 'Variable value to set')
  .setAction(async ({ target: targetAddr, name, value }, hre) => {
    console.log(`Sender address ${(await hre.ethers.getSigners())[0].address}`);

    const target = await hre.ethers.getContractAt('Agreement', targetAddr);
    await target.setStorageAddress(hex4Bytes(hre, name), value);

    console.log('✅ Done ✅');
  });
