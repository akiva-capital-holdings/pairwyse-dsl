import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { hex4Bytes } from '../utils/utils';
import { AgreementMock, ConditionalTxsMock } from '../../typechain-types/agreement/mocks';
import { deploy, addSteps } from '../../scripts/deploy.agreement';
import { aliceAndBobSteps, aliceBobAndCarl, businessCaseSteps } from '../../scripts/data/agreement';

const dotenv = require('dotenv');

dotenv.config();

describe.only('Agreement: Alice, Bob, Carl', () => {
  let agreement: AgreementMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let anybody: SignerWithAddress;
  let txsAddr: string;
  let txs: ConditionalTxsMock;
  let NEXT_MONTH: number;
  let LAST_BLOCK_TIMESTAMP: number;
  let snapshotId: number;

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;
  const oneEthBN = parseEther('1');
  const tenTokens = parseEther('10');

  before(async () => {
    // TODO: need more simplifications for all tests
    /*
      - deployment module
      - tests module templates
      - gather module
    */
    agreement = (await deploy()) as AgreementMock;
    [alice, bob, carl, anybody] = await ethers.getSigners();

    const txId = 1;
    const requiredTxs: number[] = [];
    const signatories = [alice.address];
    const conditions = ['blockTimestamp > loadLocal uint256 LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';
    const ContextCont = await ethers.getContractFactory('Context');

    await addSteps(
      [{ txId, requiredTxs, signatories, conditions, transaction }],
      ContextCont,
      agreement.address
    );
    await addSteps(
      aliceAndBobSteps(alice, bob, oneEthBN, tenTokens),
      ContextCont,
      agreement.address
    );
    await addSteps(
      aliceBobAndCarl(alice, bob, carl, oneEthBN, tenTokens),
      ContextCont,
      agreement.address
    );

    LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
    txsAddr = await agreement.txs();
    txs = (await ethers.getContractAt('ConditionalTxs', txsAddr)) as ConditionalTxsMock;
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('one condition', async () => {
    // Set variables
    await txs.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await txs.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const txId = 1;

    // Top up contract
    await anybody.sendTransaction({ to: txsAddr, value: oneEthBN });

    // Bad signatory
    await expect(agreement.connect(anybody).execute(txId)).to.be.revertedWith(
      'Agreement: bad tx signatory'
    );

    // Condition isn't satisfied
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'Agreement: tx condition is not satisfied'
    );

    // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, oneEthBN);

    // Tx already executed
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );

    // clean transaction history inside of the contracts
    // await txs.cleanTx([1], [alice.address]);
  });

  it('Alice (borrower) and Bob (lender)', async () => {
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));

    // Set variables
    await txs.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await txs.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await txs.setStorageAddress(hex4Bytes('BOB'), bob.address);

    // Alice deposits 1 ETH to SC
    await expect(agreement.connect(alice).execute(21, { value: 0 })).to.be.revertedWith(
      'Agreement: tx fulfilment error'
    );
    await expect(
      agreement.connect(alice).execute(21, { value: parseEther('2') })
    ).to.be.revertedWith('Agreement: tx fulfilment error');
    await expect(agreement.connect(bob).execute(22)).to.be.revertedWith(
      'ConditionalTxs: required tx #21 was not executed'
    );
    await expect(agreement.connect(alice).execute(23)).to.be.revertedWith(
      'ConditionalTxs: required tx #22 was not executed'
    );

    await agreement.connect(alice).execute(21, { value: oneEthBN });

    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEthBN);
    await expect(agreement.connect(alice).execute(21, { value: oneEthBN })).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );

    // Bob lends 10 tokens to Alice
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(22)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(23)).to.changeEtherBalance(alice, oneEthBN);
    expect(await token.balanceOf(alice.address)).to.equal(0);

    // clean transaction history inside of the contracts
    // await txs.cleanTx([21, 22, 23], [alice.address, bob.address]);
  });

  it('Alice (borrower), Bob (lender), and Carl (insurer)', async () => {
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));
    await token.connect(bob).transfer(carl.address, tenTokens);

    // Set variables
    await txs.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await txs.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await txs.setStorageUint256(hex4Bytes('EXPIRY'), NEXT_MONTH);
    await txs.setStorageAddress(hex4Bytes('BOB'), bob.address);
    await txs.setStorageAddress(hex4Bytes('CARL'), carl.address);
    await txs.setStorageAddress(hex4Bytes('TRANSACTIONS'), txsAddr);

    // Alice deposits 1 ETH to SC
    console.log('Alice deposits 1 ETH to SC');
    await agreement.connect(alice).execute(31, { value: oneEthBN });
    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEthBN);

    // Carl deposits 10 tokens to SC
    console.log('Carl deposits 10 tokens to SC');
    // console.log((await token.balanceOf(carl.address)).toString());
    await token.connect(carl).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(carl).execute(32)).to.changeTokenBalance(
      token,
      txs,
      tenTokens
    );

    // Bob lends 10 tokens to Alice
    console.log('Bob lends 10 tokens to Alice');
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(33)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    console.log('Alice returns 10 tokens to Bob and collects 1 ETH');
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(34)).to.changeEtherBalance(alice, oneEthBN);
    expect(await token.balanceOf(alice.address)).to.equal(0);

    // TODO: Why was it commented? - To speed up the test. It may be enabled

    // // If Alice didn't return 10 tokens to Bob before EXPIRY
    // // then Bob can collect 10 tokens from Carl
    // await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // console.log(
    //   'If Alice didn not return 10 tokens to Bob before EXPIRY then ' +
    //     'Bob can collect 10 tokens from Carl'
    // );
    // await expect(() => agreement.connect(bob).execute(5)).to.changeTokenBalance(
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

    // clean transaction history inside of the contracts
    // await txs.cleanTx([31, 32, 33, 34, 35, 36], [alice.address, bob.address, carl.address]);
  });
});
