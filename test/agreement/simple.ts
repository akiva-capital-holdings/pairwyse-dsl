import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { addSteps, hex4Bytes } from '../utils/utils';
import { deployAgreement, deployPreprocessor } from '../../scripts/utils/deploy.utils';
import {
  aliceAndBobSteps,
  aliceBobAndCarl,
  aliceAndAnybodySteps,
  oneEthToBobSteps,
} from '../../scripts/data/agreement';
import { Agreement } from '../../typechain-types';
import { anyone, ONE_DAY, ONE_MONTH } from '../utils/constants';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';

const { ethers, network } = hre;

describe('Agreement: Alice, Bob, Carl', () => {
  let agreement: Agreement;
  let agreementAddr: string;
  let preprocessorAddr: string;
  let multisig: MultisigMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let anybody: SignerWithAddress;
  let snapshotId: number;
  let NEXT_MONTH = 0;

  const oneEthBN = parseEther('1');
  const tenTokens = parseEther('10');

  before(async () => {
    multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    agreementAddr = await deployAgreement(hre, multisig.address);
    preprocessorAddr = await deployPreprocessor(hre);
    agreement = await ethers.getContractAt('Agreement', agreementAddr);

    [alice, bob, carl, anybody] = await ethers.getSigners();

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('incorrect signatory', async () => {
    const txId = '1';
    const signatories = [alice.address];
    const conditions = ['blockTimestamp > var LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';

    await addSteps(
      preprocessorAddr,
      [{ txId, requiredTxs: [], signatories, conditions, transaction }],
      agreementAddr,
      multisig
    );

    await expect(agreement.connect(bob).execute(txId)).to.be.revertedWith('AGR1');
  });

  it('update test', async () => {
    const updateAgreementAddr = await deployAgreement(hre, alice.address);
    const updateAgreement = await ethers.getContractAt('Agreement', updateAgreementAddr);
    const recordContext = await (await ethers.getContractFactory('Context')).deploy();
    await recordContext.setAppAddress(alice.address);
    const firstTxId = '1';
    const secondTxId = '2';
    const signatories = [alice.address];
    const conditions = ['blockTimestamp > var LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';
    // record by agreement owner
    await updateAgreement
      .connect(alice)
      .update(firstTxId, [], signatories, transaction, conditions, recordContext.address, [
        recordContext.address,
      ]);

    // record by other address
    await updateAgreement
      .connect(bob)
      .update(secondTxId, [], signatories, transaction, conditions, recordContext.address, [
        recordContext.address,
      ]);

    // owner set isActive = true
    const trueResult = await updateAgreement.records(firstTxId);
    // other set isActive = false
    const falseResult = await updateAgreement.records(secondTxId);
    expect(trueResult.isActive).to.equal(true);
    expect(falseResult.isActive).to.equal(false);
  });

  it('one condition', async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await agreement.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const txId = '1';
    const signatories = [alice.address];
    const conditions = ['blockTimestamp > var LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';

    await addSteps(
      preprocessorAddr,
      [{ txId, requiredTxs: [], signatories, conditions, transaction }],
      agreementAddr,
      multisig
    );

    // Top up contract
    await anybody.sendTransaction({ to: agreementAddr, value: oneEthBN });

    // Bad signatory
    // await expect(agreement.connect(anybody).execute(txId)).to.be.revertedWith('AGR1');

    // Condition isn't satisfied
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith('AGR6');

    // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);

    await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, oneEthBN);

    // Tx already executed
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith('AGR7');
  });

  it('Alice gives 1 ETH to Bob', async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes('BOB'), bob.address);

    // Update Agreement
    await addSteps(preprocessorAddr, oneEthToBobSteps(alice), agreementAddr, multisig);

    // Execute
    await expect(await agreement.connect(alice).execute(1, { value: oneEthBN })).changeEtherBalance(
      alice,
      oneEthBN.mul(-1)
    );
    await expect(await agreement.connect(alice).execute(2)).to.changeEtherBalance(bob, oneEthBN);
  });

  it('Alice (borrower) and Bob (lender)', async () => {
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));

    await addSteps(
      preprocessorAddr,
      aliceAndBobSteps(alice, bob, oneEthBN, tenTokens),
      agreementAddr,
      multisig
    );

    // Set variables
    await agreement.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await agreement.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await agreement.setStorageAddress(hex4Bytes('BOB'), bob.address);

    // Alice deposits 1 ETH to SC
    await expect(agreement.connect(alice).execute(21, { value: 0 })).to.be.revertedWith('AGR3');
    await expect(
      agreement.connect(alice).execute(21, { value: parseEther('2') })
    ).to.be.revertedWith('AGR3');
    await expect(agreement.connect(bob).execute(22)).to.be.revertedWith('AGR2');
    await expect(agreement.connect(alice).execute(23)).to.be.revertedWith('AGR2');

    await agreement.connect(alice).execute(21, { value: oneEthBN });

    expect(await ethers.provider.getBalance(agreementAddr)).to.equal(oneEthBN);
    await expect(agreement.connect(alice).execute(21, { value: oneEthBN })).to.be.revertedWith(
      'AGR7'
    );

    // Bob lends 10 tokens to Alice
    await token.connect(bob).approve(agreementAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(22)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(agreementAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(23)).to.changeEtherBalance(alice, oneEthBN);
    expect(await token.balanceOf(alice.address)).to.equal(0);
  });

  it('Alice (borrower), Bob (lender), and Carl (insurer)', async () => {
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));
    await token.connect(bob).transfer(carl.address, tenTokens);

    await addSteps(
      preprocessorAddr,
      aliceBobAndCarl(alice, bob, carl, oneEthBN, tenTokens),
      agreementAddr,
      multisig
    );

    // Set variables
    await agreement.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await agreement.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await agreement.setStorageUint256(hex4Bytes('EXPIRY'), NEXT_MONTH);
    await agreement.setStorageAddress(hex4Bytes('BOB'), bob.address);
    await agreement.setStorageAddress(hex4Bytes('CARL'), carl.address);
    await agreement.setStorageAddress(hex4Bytes('TRANSACTIONS'), agreementAddr);

    // Alice deposits 1 ETH to SC
    console.log('Alice deposits 1 ETH to SC');
    await agreement.connect(alice).execute(31, { value: oneEthBN });
    expect(await ethers.provider.getBalance(agreementAddr)).to.equal(oneEthBN);

    // Carl deposits 10 tokens to SC
    console.log('Carl deposits 10 tokens to SC');
    await token.connect(carl).approve(agreementAddr, tenTokens);
    await expect(() => agreement.connect(carl).execute(32)).to.changeTokenBalance(
      token,
      agreement,
      tenTokens
    );

    // Bob lends 10 tokens to Alice
    console.log('Bob lends 10 tokens to Alice');
    await token.connect(bob).approve(agreementAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(33)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    console.log('Alice returns 10 tokens to Bob and collects 1 ETH');
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(agreementAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(34)).to.changeEtherBalance(alice, oneEthBN);
    expect(await token.balanceOf(alice.address)).to.equal(0);

    // To speed up the test. It may be enabled
    // // If Alice didn't return 10 tokens to Bob before EXPIRY
    // // then Bob can collect 10 tokens from Carl
    // await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // console.log(
    //   'If Alice didn not return 10 tokens to Bob before EXPIRY then ' +
    //     'Bob can collect 10 tokens from Carl'
    // );
    // await expect(() => agreement.connect(bob).execute(35)).to.changeTokenBalance(
    //   token,
    //   bob,
    //   tenTokens
    // );

    // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    console.log('If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens');
    await expect(() => agreement.connect(carl).execute(36)).to.changeTokenBalance(
      token,
      carl,
      tenTokens
    );
  });

  it(
    '`anyone` as signatory can execute withdraw DAI and then return the ' +
      'same amount of DAI in Agreement conditional tx',
    async () => {
      // Deploy Token contract
      const daiToken = await (await ethers.getContractFactory('Token'))
        .connect(alice)
        .deploy(parseEther('100'));

      const PURCHASE_PERCENT = 10; // as an example
      // Set variables
      await agreement.setStorageAddress(hex4Bytes('GP'), carl.address);
      await agreement.setStorageAddress(hex4Bytes('DAI'), daiToken.address);
      await agreement.setStorageUint256(hex4Bytes('PURCHASE_PERCENT'), PURCHASE_PERCENT);
      await agreement.setStorageUint256(hex4Bytes('TRANSACTIONS_CONT'), agreementAddr);

      const index = '4';
      const signatories = [anyone];
      await addSteps(
        preprocessorAddr,
        aliceAndAnybodySteps(signatories, index),
        agreementAddr,
        multisig
      );

      // Alice deposits 10 dai tokens to SC
      await daiToken.connect(alice).transfer(agreementAddr, tenTokens);

      // get total amount of dai tokens on the conditional transaction contract
      const TOKEN_BAL_OF_TXS = await daiToken.balanceOf(agreementAddr);
      // check that contract has that amount of tokens
      expect(TOKEN_BAL_OF_TXS).to.equal(tenTokens);

      // calculate the purchase amount from the total stored value
      const PURCHASE_AMOUNT = TOKEN_BAL_OF_TXS.mul(PURCHASE_PERCENT).div(100);
      // check that PURCHASE_AMOUNT is an a 10% of TOKEN_BAL_OF_TXS
      expect(PURCHASE_AMOUNT).to.equal(oneEthBN);
      // get future time
      const FUND_INVESTMENT_DATE = NEXT_MONTH + 7 * ONE_DAY;

      await agreement.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT);
      await agreement.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), FUND_INVESTMENT_DATE);
      // setup the certain date in the future for transaction execution
      await ethers.provider.send('evm_setNextBlockTimestamp', [FUND_INVESTMENT_DATE]);

      await expect(() => agreement.connect(anybody).execute(41)).to.changeTokenBalance(
        daiToken,
        carl,
        oneEthBN
      );
    }
  );
});
