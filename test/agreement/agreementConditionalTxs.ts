import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { Context } from '../../typechain-types/dsl';
import { hex4Bytes } from '../utils/utils';
import { deployParser, deployAgreement, deployPreprocessor } from '../../scripts/data/deploy.utils';
import { Agreement } from '../../typechain-types';

describe.skip('Simple conditional transactions in Agreement', () => {
  let agreement: Agreement;
  let agreementAddr: string;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;
  let LAST_BLOCK_TIMESTAMP: number;
  let preprAddr: string;

  const ONE_MONTH = 60 * 60 * 24 * 30;
  const anyone = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  type Txs = {
    txId: number;
    requiredTxs: number[];
    signatories: string[];
    transactionStr: string;
    conditionStrings: string[];
    transactionCtx: string;
    conditionContexts: Context[];
  };

  let txs: Txs[] = [];

  before(async () => {
    LAST_BLOCK_TIMESTAMP = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
      .timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + 60 * 60 * 24 * 30;

    [alice, bob, anybody] = await ethers.getSigners();

    // Deploy contracts
    agreementAddr = await deployAgreement();
    preprAddr = await deployPreprocessor();
    agreement = await ethers.getContractAt('Agreement', agreementAddr);
  });

  beforeEach(async () => {
    // Make a snapshot
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    txs = [];
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it.skip('test one transaction', async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await agreement.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);
    const transactionContext = await agreement.context();
    const Context = await ethers.getContractFactory('Context');
    const conditionContext = await Context.deploy();
    await conditionContext.setAppAddress(agreementAddr);

    let conditions = ['blockTimestamp > loadLocal uint256 LOCK_TIME'];
    txs.push({
      txId: 1,
      requiredTxs: [],
      signatories: [alice.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrings: conditions,
      transactionCtx: transactionContext,
      conditionContexts: [conditionContext],
    });

    // Set conditional transaction
    for (let i = 0; i < txs.length; i++) {
      const {
        txId,
        requiredTxs,
        signatories,
        conditionContexts,
        conditionStrings,
        transactionCtx,
        transactionStr,
      } = txs[i];

      for (let j = 0; j < conditions.length; j++) {
        await agreement.parse(conditions[j], conditionContext.address, preprAddr);
      }
      await agreement.parse(transactionStr, transactionCtx, preprAddr);

      // Set conditional transaction
      await agreement.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await agreement.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address);
      }
      await agreement.addTxTransaction(txId, transactionStr, transactionCtx);

      // Parse all conditions and a transaction
      const condCtxLen = (await agreement.conditionContextsLen(txId)).toNumber();
      expect(condCtxLen).to.equal(1);

      // Top up contract
      const oneEthBN = ethers.utils.parseEther('1');
      await anybody.sendTransaction({ to: agreement.address, value: oneEthBN });

      // Execute transaction

      await expect(agreement.checkConditions(txId, 0)).to.be.revertedWith('CNT3');
      await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith('CNT3');
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await agreement.checkConditions(txId, 0);
      await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(
        bob,
        oneEthBN
      );
      await expect(agreement.execTx(txId, 0, alice.address)).to.be.revertedWith('CNT4');
      await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith('CNT4');
    }
  });

  describe('Scenarios', () => {
    it('borrower/lender scenario', async () => {
      const ContextCont = await ethers.getContractFactory('Context');
      // Deploy Token contract
      const token = await (await ethers.getContractFactory('Token'))
        .connect(bob)
        .deploy(ethers.utils.parseEther('1000'));

      // Set variables
      const oneEth = ethers.utils.parseEther('1');
      const tenTokens = ethers.utils.parseEther('10');
      await agreement.setStorageAddress(hex4Bytes('ETH_RECEIVER'), bob.address);
      await agreement.setStorageAddress(hex4Bytes('TOKEN_RECEIVER'), alice.address);
      await agreement.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);
      await agreement.setStorageUint256(hex4Bytes('TOKEN_ADDR'), token.address);
      const transactionContext = await agreement.context();

      const Context = await ethers.getContractFactory('Context');
      const conditionContext = await Context.deploy();
      await conditionContext.setAppAddress(agreementAddr);

      const conditionContext2 = await Context.deploy();
      await conditionContext2.setAppAddress(agreementAddr);

      // Define Conditional Transactions
      txs.push({
        txId: 1,
        requiredTxs: [],
        signatories: [alice.address],
        transactionStr: 'sendEth ETH_RECEIVER 1000000000000000000',
        conditionStrings: ['bool true'],
        transactionCtx: transactionContext,
        conditionContexts: [conditionContext],
      });
      txs.push({
        txId: 2,
        requiredTxs: [],
        signatories: [bob.address],
        transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens}`,
        conditionStrings: ['blockTimestamp > loadLocal uint256 LOCK_TIME'],
        transactionCtx: transactionContext,
        conditionContexts: [conditionContext2],
      });

      // Set conditional transaction #1
      const txId0 = txs[0].txId;
      await agreement.addTxBlueprint(txId0, txs[0].requiredTxs, txs[0].signatories);
      await agreement.addTxCondition(
        txId0,
        txs[0].conditionStrings[0],
        txs[0].conditionContexts[0].address
      );
      await agreement.addTxTransaction(txId0, txs[0].transactionStr, txs[0].transactionCtx);

      // Set conditional transaction #2
      const txId1 = txs[1].txId;
      await agreement.addTxBlueprint(txId1, txs[1].requiredTxs, txs[1].signatories);
      await agreement.addTxCondition(
        txId1,
        txs[1].conditionStrings[0],
        txs[1].conditionContexts[0].address
      );
      await agreement.addTxTransaction(txId1, txs[1].transactionStr, txs[1].transactionCtx);
      let ctx0 = await ethers.getContractAt('Context', txs[0].transactionCtx);
      let ctx1 = await ethers.getContractAt('Context', txs[1].transactionCtx);

      await ctx0.setMsgSender(alice.address);
      await txs[0].conditionContexts[0].setMsgSender(alice.address);

      await ctx1.setMsgSender(bob.address);
      await txs[1].conditionContexts[0].setMsgSender(bob.address);

      // Parse all conditions and a transaction #1
      const condCtxLen0 = (await agreement.conditionContextsLen(txId0)).toNumber();
      for (let i = 0; i < condCtxLen0; i++) {
        await agreement.parse(
          await agreement.conditionStrings(txId0, i),
          await agreement.conditionContexts(txId0, i),
          preprAddr
        );
      }
      await agreement.parse(txs[0].transactionStr, txs[0].transactionCtx, preprAddr);

      // Parse all conditions and a transaction #2
      const condCtxLen1 = (await agreement.conditionContextsLen(txId1)).toNumber();
      for (let i = 0; i < condCtxLen1; i++) {
        await agreement.parse(
          await agreement.conditionStrings(txId1, i),
          await agreement.conditionContexts(txId1, i),
          preprAddr
        );
      }
      await agreement.parse(txs[1].transactionStr, txs[1].transactionCtx, preprAddr);

      // Top up contract (ETH)
      await anybody.sendTransaction({ to: agreement.address, value: oneEth });

      // Top up contract (tokens)
      await token.transfer(agreement.address, tenTokens);
      expect(await token.balanceOf(agreement.address)).to.equal(tenTokens);

      // TODO: Execute transactions
      // it has changed by 0 wei
      // const oneEth1 = ethers.utils.parseEther('1');
      // expect(await alice.getBalance()).to.eq('9999925673067436688547')
      // expect(await bob.getBalance()).to.eq('9999998463677757207201')
      // expect(await agreement.getBalance()).to.eq('9999998463677757207201')
      // await agreement.connect(alice).execute(txId0);
      // expect(await alice.getBalance()).to.eq('9999924033568113061718')
      // expect(await bob.getBalance()).to.eq('9999998463677757207201')
      // expect(await agreement.getBalance()).to.eq('9999998463677757207201')
      await expect(await agreement.connect(alice).execute(txId0)).to.changeEtherBalance(
        bob,
        oneEth
      );
      // await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      // await expect(() => agreement.connect(bob).execute(txId1)).to.changeTokenBalance(
      //   token,
      //   alice,
      //   tenTokens
      // );
    });
  });

  // describe('`anyone` address in the signatories', () => {
  //   it('should revert if `anyone` address is the last address in the list', async () => {
  //     // it not possible to update transaction with alice, bobo and 0xFfFF address
  //     const signatories = [alice.address, bob.address, anyone];
  //     await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
  //   });

  //   it('should revert if `anyone` address is the first address in the list', async () => {
  //     const signatories = [anyone, bob.address, alice.address];
  //     await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
  //   });

  //   it('should revert if `anyone` and zero addresses in the list', async () => {
  //     const signatories = [zeroAddress, anyone];
  //     await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
  //   });

  //   it('should revert if `anyone` was provided twice', async () => {
  //     const signatories = [anyone, anyone];
  //     await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
  //   });

  //   // TODO: (by Yevheniia) check specification with Misha
  //   // it('should revert if signatories were not provided',
  //   //   async () => {
  //   //     await expect(app.addTxBlueprint(1, [], [])).to.be.revertedWith(
  //   //       'CNT1'
  //   //     );
  //   //   }
  //   // );
  // });
});
