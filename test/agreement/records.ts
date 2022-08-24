import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ContextMock as ContextMockType, ParserMock } from '../../typechain-types/dsl/mocks';
import { hex4Bytes } from '../utils/utils';
import { deployParserMock } from '../../scripts/data/deploy.utils.mock';
import { deployAgreement, deployPreprocessor } from '../../scripts/data/deploy.utils';
import { Agreement } from '../../typechain-types';
import { ANYONE, ONE_MONTH } from '../utils/constants';

// TODO: rename everywhere in the project 'Conditional Transactions' to 'Records'

describe('Simple Records in Agreement', () => {
  let agreement: Agreement;
  let agreementAddr: string;
  let parser: ParserMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;
  let preprAddr: string;

  type Txs = {
    txId: number;
    requiredTxs: number[];
    signatories: string[];
    transactionStr: string;
    conditionStrings: string[];
    transactionCtx: ContextMockType;
    conditionContexts: ContextMockType[];
  };

  let txs: Txs[] = [];

  before(async () => {
    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    [alice, bob, anybody] = await ethers.getSigners();

    // Deploy contracts
    agreementAddr = await deployAgreement();
    preprAddr = await deployPreprocessor();
    agreement = await ethers.getContractAt('Agreement', agreementAddr);

    const parserAddr = await deployParserMock();
    parser = await ethers.getContractAt('ParserMock', parserAddr);
    // Make a snapshot
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    txs = [];
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('test one transaction', async () => {
    // Set variables
    await agreement.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await agreement.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const ContextMock = await ethers.getContractFactory('ContextMock');
    const transactionContext = await ContextMock.deploy();
    await transactionContext.setAppAddress(agreementAddr);
    const conditionContext = await ContextMock.deploy();
    await conditionContext.setAppAddress(agreementAddr);

    txs.push({
      txId: 1,
      requiredTxs: [],
      signatories: [alice.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrings: ['blockTimestamp > loadLocal uint256 LOCK_TIME'],
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

      // Set conditional transaction
      await agreement.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await agreement.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address);
      }
      await agreement.addTxTransaction(txId, transactionStr, transactionCtx.address);

      // Set msg senders
      // TODO: do we really need kind of these tests if we will have Roles?
      await transactionCtx.setMsgSender(alice.address);
      await conditionContexts[0].setMsgSender(alice.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await agreement.conditionContextsLen(txId)).toNumber();
      expect(condCtxLen).to.equal(1);
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await agreement.conditionContexts(txId, j),
          await agreement.conditionStrings(txId, j)
        );
      }
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Top up contract
      const oneEthBN = ethers.utils.parseEther('1');
      await anybody.sendTransaction({ to: agreement.address, value: oneEthBN });

      // Execute transaction
      await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith('CNT3');
      await expect(agreement.checkConditions(txId, 0)).to.be.revertedWith('CNT3');
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(await agreement.execTx(txId, 0, alice.address)).to.changeEtherBalance(
        bob,
        oneEthBN
      );
      await expect(agreement.execTx(txId, 0, alice.address)).to.be.revertedWith('CNT4');
    }
  });

  describe('Scenarios', () => {
    it('borrower/lender scenario', async () => {
      const ContextCont = await ethers.getContractFactory('ContextMock');
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

      // Define Conditional Transactions
      txs.push({
        txId: 1,
        requiredTxs: [],
        signatories: [alice.address],
        transactionStr: 'sendEth ETH_RECEIVER 1000000000000000000',
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      });
      txs.push({
        txId: 2,
        requiredTxs: [],
        signatories: [bob.address],
        transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens}`,
        conditionStrings: ['blockTimestamp > loadLocal uint256 LOCK_TIME'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      });

      // Set conditional transaction #1
      const { txId: txId0 } = txs[0];
      await agreement.addTxBlueprint(txId0, txs[0].requiredTxs, txs[0].signatories);
      await agreement.addTxCondition(
        txId0,
        txs[0].conditionStrings[0],
        txs[0].conditionContexts[0].address
      );
      await agreement.addTxTransaction(txId0, txs[0].transactionStr, txs[0].transactionCtx.address);

      // Set conditional transaction #2
      const { txId: txId1 } = txs[1];
      await agreement.addTxBlueprint(txId1, txs[1].requiredTxs, txs[1].signatories);
      await agreement.addTxCondition(
        txId1,
        txs[1].conditionStrings[0],
        txs[1].conditionContexts[0].address
      );
      await agreement.addTxTransaction(txId1, txs[1].transactionStr, txs[1].transactionCtx.address);

      // Set app addresses & msg senders
      await txs[0].transactionCtx.setAppAddress(agreement.address);
      await txs[0].transactionCtx.setMsgSender(alice.address);
      await txs[0].conditionContexts[0].setAppAddress(agreement.address);
      await txs[0].conditionContexts[0].setMsgSender(alice.address);

      await txs[1].transactionCtx.setAppAddress(agreement.address);
      await txs[1].transactionCtx.setMsgSender(bob.address);
      await txs[1].conditionContexts[0].setAppAddress(agreement.address);
      await txs[1].conditionContexts[0].setMsgSender(bob.address);

      // Parse all conditions and a transaction #1
      const condCtxLen0 = (await agreement.conditionContextsLen(txId0)).toNumber();
      for (let i = 0; i < condCtxLen0; i++) {
        await parser.parse(
          preprAddr,
          await agreement.conditionContexts(txId0, i),
          await agreement.conditionStrings(txId0, i)
        );
      }
      await parser.parse(preprAddr, txs[0].transactionCtx.address, txs[0].transactionStr);

      // Parse all conditions and a transaction #2
      const condCtxLen1 = (await agreement.conditionContextsLen(txId1)).toNumber();
      for (let i = 0; i < condCtxLen1; i++) {
        await parser.parse(
          preprAddr,
          await agreement.conditionContexts(txId1, i),
          await agreement.conditionStrings(txId1, i)
        );
      }
      await parser.parse(preprAddr, txs[1].transactionCtx.address, txs[1].transactionStr);

      // Top up contract (ETH)
      await anybody.sendTransaction({ to: agreement.address, value: oneEth });

      // Top up contract (tokens)
      await token.transfer(agreement.address, tenTokens);
      expect(await token.balanceOf(agreement.address)).to.equal(tenTokens);

      // Execute transactions
      await expect(await agreement.execTx(txId0, 0, alice.address)).to.changeEtherBalance(
        bob,
        oneEth
      );
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(() => agreement.execTx(txId1, 0, bob.address)).to.changeTokenBalance(
        token,
        alice,
        tenTokens
      );
    });
  });

  describe('`anyone` address in the signatories', () => {
    it('should revert if `anyone` address is the last address in the list', async () => {
      // it not possible to update transaction with alice, bobo and 0xFfFF address
      const signatories = [alice.address, bob.address, ANYONE];
      await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if `anyone` address is the first address in the list', async () => {
      const signatories = [ANYONE, bob.address, alice.address];
      await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if `anyone` and zero addresses in the list', async () => {
      const signatories = [ethers.constants.AddressZero, ANYONE];
      await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if `anyone` was provided twice', async () => {
      const signatories = [ANYONE, ANYONE];
      await expect(agreement.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    // TODO: (by Yevheniia) check specification with Misha
    // it('should revert if signatories were not provided',
    //   async () => {
    //     await expect(app.addTxBlueprint(1, [], [])).to.be.revertedWith(
    //       'CNT1'
    //     );
    //   }
    // );
  });
});
