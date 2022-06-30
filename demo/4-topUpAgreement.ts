import { ethers } from 'hardhat';

// TODO: update `agreementAddr`
const agreementAddr = '0xbC5d4E0192D662D3e048E71E01F6a8812a17Deff';

(async () => {
  const [deployer] = await ethers.getSigners();

  const agreement = await ethers.getContractAt('Agreement', agreementAddr);
  const txsAddr = await agreement.txs();

  // Send 0.1 ether
  await deployer.sendTransaction({
    to: txsAddr,
    value: ethers.utils.parseEther('0.1'),
  });
})();
