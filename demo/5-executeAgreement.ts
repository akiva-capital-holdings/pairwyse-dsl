import { expect } from 'chai';
import { ethers } from 'hardhat';

// TODO: update `agreementAddr`
const agreementAddr = '0xbC5d4E0192D662D3e048E71E01F6a8812a17Deff';
const txId = 1;
const sendAmount = ethers.utils.parseEther('0.1');

(async () => {
  const [, alice, bob] = await ethers.getSigners();

  const agreement = await ethers.getContractAt('Agreement', agreementAddr);

  // Execute
  expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, sendAmount);
})();
