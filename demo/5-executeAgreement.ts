import { expect } from 'chai';
import { ethers } from 'hardhat';

// TODO: update `agreementAddr`
const agreementAddr = '0xC2bEf244bf5B15Fa2cCEE0cFCb31C7144D0E642c';
const txId = 1;
const sendAmount = ethers.utils.parseEther('0.1');

(async () => {
  const [, alice, bob] = await ethers.getSigners();

  const agreement = await ethers.getContractAt('Agreement', agreementAddr);

  // Execute
  expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, sendAmount);
})();
