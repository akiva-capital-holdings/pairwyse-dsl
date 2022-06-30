import { ethers } from 'hardhat';

// TODO: update `agreementAddr`
const agreementAddr = '0xC2bEf244bf5B15Fa2cCEE0cFCb31C7144D0E642c';

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
