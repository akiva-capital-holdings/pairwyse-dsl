import { expect } from 'chai';
import { ethers } from 'hardhat';

// TODO: update `agreementAddr`
const agreementAddr = '0x49e5d290799e1AeF5Bd8360B54E72D8D29Ea6E8c';
const txId = 2;
const sendAmount = ethers.utils.parseEther('0.1');

(async () => {
  const [, alice, bob] = await ethers.getSigners();

  const agreement = await ethers.getContractAt('Agreement', agreementAddr);

  // Execute
  expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, sendAmount);
})();
