import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { Contract } from 'ethers';
import { hex4Bytes } from '../utils/utils';
import { aliceAndBobSteps, aliceBobAndCarl } from '../data/agreement';
import { Agreement } from '../../typechain/Agreement';
import { ConditionalTxs, Context__factory } from '../../typechain';
import { TxObject } from '../types';


const dotenv = require('dotenv');
dotenv.config();

describe.skip('Agreement: Alice, Bob, Carl', () => {
  let ContextCont: Context__factory;
  let agreement: Agreement;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let anybody: SignerWithAddress;
  let txsAddr: string;
  let txs: ConditionalTxs;
  let NEXT_MONTH: number;
  let LAST_BLOCK_TIMESTAMP: number;

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;


  // Add tx objects to Agreement
  const addSteps = async (steps: TxObject[], Ctx: Context__factory) => {
    let txCtx;

    for await (const step of steps) {
      console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
      txCtx = await Ctx.deploy();
      const cdCtxsAddrs = [];

      console.log('\nTerm Conditions');

      for (let j = 0; j < step.conditions.length; j++) {
        const cond = await Ctx.deploy();
        cdCtxsAddrs.push(cond.address);
        await agreement.parse(step.conditions[j], cond.address);
        console.log(
          `\n\taddress: \x1b[35m${cond.address}\x1b[0m\n\tcondition ${j + 1}:\n\t\x1b[33m${
            step.conditions[j]
          }\x1b[0m`
        );
      }
      await agreement.parse(step.transaction, txCtx.address);
      console.log('\nTerm transaction');
      console.log(`\n\taddress: \x1b[35m${txCtx.address}\x1b[0m`);
      console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);
      const { hash } = await agreement.update(
        step.txId,
        step.requiredTxs,
        step.signatories,
        step.transaction,
        step.conditions,
        txCtx.address,
        cdCtxsAddrs
      );
      console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${hash}\x1b[0m`);
    }
  };

  before(async () => {
    [alice, bob, carl, anybody,] = await ethers.getSigners();

    LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    ContextCont = await ethers.getContractFactory('Context');
  });

  beforeEach(async () => {
    let address = process.env.AGREEMENT_ADDR;
    if(address) {
      agreement = await ethers.getContractAt('Agreement', address);
    } else {
      // TODO: what should we do if the user did not set the AGREEMENT_ADDR?
      console.log('The agreement address is undefined');
    }
    txsAddr = await agreement.txs();
    txs = await ethers.getContractAt('ConditionalTxs', txsAddr);
    
  });

  afterEach(async () => {
    // reset the ConditionalTxs contract after each test to use the same agreement again
    await agreement.resetTXs();
  });

  it('one condition', async () => {
    // Set variables
    await txs.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await txs.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const txId = 1;
    const requiredTxs: number[] = [];
    const signatories = [alice.address];
    const conditions = ['blockTimestamp > loadLocal uint256 LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';

    // Update
    await addSteps([{ txId, requiredTxs, signatories, conditions, transaction }], ContextCont);

    // Top up contract
    const oneEthBN = parseEther('1');

    await anybody.sendTransaction({ to: txsAddr, value: oneEthBN });

    /**
     * Execute
     */
    // Bad signatory
    await expect(agreement.connect(anybody).execute(txId)).to.be.revertedWith(
      'Agreement: bad tx signatory'
    );

    // Condition isn't satisfied
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'Agreement: tx condition is not satisfied'
    );

    // // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, oneEthBN);

    // Tx already executed
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );

    // clean transaction history inside of the contracts
    await txs.cleanTx([1], signatories)
    
  });

  it('Alice (borrower) and Bob (lender)', async () => {
    const oneEth = parseEther('1');
    const tenTokens = parseEther('10');
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));

    // Set variables
    await txs.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await txs.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await txs.setStorageAddress(hex4Bytes('BOB'), bob.address);

    // Add tx objects to Agreement
    await addSteps(aliceAndBobSteps(alice, bob, oneEth, tenTokens), ContextCont);

    // Alice deposits 1 ETH to SC
    await expect(agreement.connect(alice).execute(1, { value: 0 })).to.be.revertedWith(
      'Agreement: tx fulfilment error'
    );
    await expect(
      agreement.connect(alice).execute(1, { value: parseEther('2') })
    ).to.be.revertedWith('Agreement: tx fulfilment error');
    await expect(agreement.connect(bob).execute(2)).to.be.revertedWith(
      'ConditionalTxs: required tx #1 was not executed'
    );
    await expect(agreement.connect(alice).execute(3)).to.be.revertedWith(
      'ConditionalTxs: required tx #2 was not executed'
    );

    await agreement.connect(alice).execute(1, { value: oneEth });

    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEth);
    await expect(agreement.connect(alice).execute(1, { value: oneEth })).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );

    // Bob lends 10 tokens to Alice
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(2)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(3)).to.changeEtherBalance(alice, oneEth);
    expect(await token.balanceOf(alice.address)).to.equal(0);

    // clean transaction history inside of the contracts
    await txs.cleanTx([1, 2, 3], [alice.address, bob.address]);
  });

  it('Alice (borrower), Bob (lender), and Carl (insurer)', async () => {
    const oneEth = parseEther('1');
    const tenTokens = parseEther('10');
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

    // Add tx objects to Agreement
    await addSteps(aliceBobAndCarl(alice, bob, carl, oneEth, tenTokens), ContextCont);

    // Alice deposits 1 ETH to SC
    console.log('Alice deposits 1 ETH to SC');
    await agreement.connect(alice).execute(1, { value: oneEth });
    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEth);

    // Carl deposits 10 tokens to SC
    console.log('Carl deposits 10 tokens to SC');
    // console.log((await token.balanceOf(carl.address)).toString());
    await token.connect(carl).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(carl).execute(2)).to.changeTokenBalance(
      token,
      txs,
      tenTokens
    );

    // Bob lends 10 tokens to Alice
    console.log('Bob lends 10 tokens to Alice');
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(3)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    console.log('Alice returns 10 tokens to Bob and collects 1 ETH');
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(4)).to.changeEtherBalance(alice, oneEth);
    expect(await token.balanceOf(alice.address)).to.equal(0);

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
    await expect(() => agreement.connect(carl).execute(6)).to.changeTokenBalance(
      token,
      carl,
      tenTokens
    );

    // clean transaction history inside of the contracts
    await txs.cleanTx([1, 2, 3, 4, 5, 6], [alice.address, bob.address]);
  });
});