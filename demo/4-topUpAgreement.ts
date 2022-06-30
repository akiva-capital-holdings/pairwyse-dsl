import { ethers } from 'hardhat';

// TODO: update `agreementAddr`
const agreementAddr = '0x49e5d290799e1AeF5Bd8360B54E72D8D29Ea6E8c';

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
