import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ContextMock as ContextMockType, ParserMock } from '../../typechain-types/dsl/mocks';
import { hex4Bytes } from '../utils/utils';
import { deployParserMock } from '../../scripts/data/deploy.utils.mock';
import { deployAgreement, deployPreprocessor } from '../../scripts/data/deploy.utils';
import { Agreement, ContextMock__factory } from '../../typechain-types';
import { ANYONE, ONE_MONTH } from '../utils/constants';

// TODO: rename everywhere in the project 'Conditional Transactions' to 'Records'

describe('Simple Records in Agreement', () => {
  let app: Agreement;
  let appAddr: string;
  let parser: ParserMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;
  let preprAddr: string;
  let ContextCont: ContextMock__factory;

  const oneEth = ethers.utils.parseEther('1');
  const tenTokens = ethers.utils.parseEther('10');

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
    appAddr = await deployAgreement();
    preprAddr = await deployPreprocessor();
    app = await ethers.getContractAt('Agreement', appAddr);
    ContextCont = await ethers.getContractFactory('ContextMock');

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
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const ContextMock = await ethers.getContractFactory('ContextMock');
    const transactionContext = await ContextMock.deploy();
    await transactionContext.setAppAddress(appAddr);
    const conditionContext = await ContextMock.deploy();
    await conditionContext.setAppAddress(appAddr);

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
      await app.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addTxTransaction(txId, transactionStr, transactionCtx.address);

      // Set msg senders
      // TODO: do we really need kind of these tests if we will have Roles?
      await transactionCtx.setMsgSender(alice.address);
      await conditionContexts[0].setMsgSender(alice.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(txId)).toNumber();
      expect(condCtxLen).to.equal(1);

      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(txId, j),
          await app.conditionStrings(txId, j)
        );
      }
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute transaction
      await expect(app.connect(alice).execute(txId)).to.be.revertedWith('CNT3');
      await expect(app.checkConditions(txId, 0)).to.be.revertedWith('CNT3');
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(await app.execTx(txId, 0, alice.address)).to.changeEtherBalance(bob, oneEth);
      await expect(app.execTx(txId, 0, alice.address)).to.be.revertedWith('CNT4');
    }
  });

  it('more than one condition', async () => {
    txs.push({
      txId: 9,
      requiredTxs: [],
      signatories: [alice.address],
      transactionStr: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_REMAINING',
      conditionStrings: [
        `loadLocal uint256 GP_INITIAL +
        loadLocal uint256 LP_TOTAL >= loadLocal uint256 INITIAL_FUNDS_TARGET`,
        `(loadLocal uint256 DEPOSIT_MIN_PERCENT * loadLocal uint256 LP_TOTAL
            / loadLocal uint256 P1) setUint256 TWO_PERCENT`,
        `
        (loadLocal uint256 TWO_PERCENT > loadLocal uint256 GP_INITIAL)
        ifelse POS NEG
        end
        POS {
          (loadLocal uint256 TWO_PERCENT - loadLocal uint256 GP_INITIAL
          ) setUint256 GP_REMAINING
        }
        NEG {
          0 setUint256 GP_REMAINING
        }`,
        'TIME >= loadLocal uint256 LOW_LIM',
        'TIME <= loadLocal uint256 UP_LIM',
        `(balanceOf DAI TRANSACTIONS_CONT) >=
            ((loadLocal uint256 INITIAL_FUNDS_TARGET * loadLocal uint256 P1) / 100)`,
      ],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [
        await ContextCont.deploy(),
        await ContextCont.deploy(),
        await ContextCont.deploy(),
        await ContextCont.deploy(),
        await ContextCont.deploy(),
        await ContextCont.deploy(),
      ],
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
      await app.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addTxTransaction(txId, transactionStr, transactionCtx.address);
      const condStrLen = (await app.conditionStringsLen(txId)).toNumber();
      expect(condStrLen).to.equal(6);
    }
  });

  // it.only('check conditions', async () => {
  //   txs.push({
  //     txId: 2,
  //     requiredTxs: [3],
  //     signatories: [bob.address],
  //     transactionStr: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
  //     conditionStrings: ['bool true'],
  //     transactionCtx: await ContextCont.deploy(),
  //     conditionContexts: [await ContextCont.deploy()],
  //   });
  //   // Set conditional transaction
  //   for (let i = 0; i < txs.length; i++) {
  //     const {
  //       txId,
  //       requiredTxs,
  //       signatories,
  //       conditionContexts,
  //       conditionStrings,
  //       transactionCtx,
  //       transactionStr,
  //     } = txs[i];

  //     // Set conditional transaction
  //     await app.addTxBlueprint(txId, requiredTxs, signatories);
  //     for (let j = 0; j < conditionContexts.length; j++) {
  //       await app.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address);
  //     }
  //     await app.addTxTransaction(txId, transactionStr, transactionCtx.address);

  //     // Set app addresses & msg senders
  //     await transactionCtx.setAppAddress(app.address);
  //     await transactionCtx.setMsgSender(alice.address);
  //     await conditionContexts[0].setAppAddress(app.address);
  //     await conditionContexts[0].setMsgSender(alice.address);

  //     // Parse all conditions and a transaction
  //     const condCtxLen = (await app.conditionContextsLen(txId)).toNumber();
  //     expect(condCtxLen).to.equal(1);
  //     const condStrLen = (await app.conditionStringsLen(txId)).toNumber();
  //     expect(condStrLen).to.equal(1);
  //     for (let j = 0; j < condCtxLen; j++) {
  //       await parser.parse(
  //         preprAddr,
  //         await app.conditionContexts(txId, j),
  //         await app.conditionStrings(txId, j)
  //       );
  //     }
  //     await parser.parse(preprAddr, transactionCtx.address, transactionStr);

  //     await expect(app.execTx(txId, 0, alice.address)).to.be.revertedWith(
  //       'ConditionalTxs: required tx #3 was not executed'
  //     );
  //   }
  // });

  it('check 0 conditions', async () => {
    txs.push({
      txId: 3,
      requiredTxs: [],
      signatories: [bob.address],
      transactionStr: '',
      conditionStrings: [''],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [await ContextCont.deploy()],
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
      await app.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await expect(
          app.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address)
        ).to.be.revertedWith('CNT2');
      }
      await expect(
        app.addTxTransaction(txId, transactionStr, transactionCtx.address)
      ).to.be.revertedWith('CNT2');
    }
  });

  it('test more than one signatories', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    txs.push({
      txId: 12,
      requiredTxs: [],
      signatories: [alice.address, anybody.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrings: ['bool true'],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [await ContextCont.deploy()],
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
      await app.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addTxCondition(txId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addTxTransaction(txId, transactionStr, transactionCtx.address);

      // Set app addresses & msg senders
      await transactionCtx.setAppAddress(app.address);
      await transactionCtx.setMsgSender(alice.address);
      await transactionCtx.setMsgSender(anybody.address);
      await conditionContexts[0].setAppAddress(app.address);
      await conditionContexts[0].setMsgSender(alice.address);
      await conditionContexts[0].setMsgSender(anybody.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(txId)).toNumber();
      expect(condCtxLen).to.equal(1);
      const condStrLen = (await app.conditionStringsLen(txId)).toNumber();
      expect(condStrLen).to.equal(1);
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(txId, j),
          await app.conditionStrings(txId, j)
        );
      }
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute first transaction
      await expect(await app.execTx(txId, 0, alice.address)).to.changeEtherBalance(bob, oneEth);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute second transaction
      await expect(await app.execTx(txId, 0, anybody.address)).to.changeEtherBalance(bob, oneEth);
    }
  });

  describe('Scenarios', () => {
    it('borrower/lender scenario', async () => {
      // Deploy Token contract
      const token = await (await ethers.getContractFactory('Token'))
        .connect(bob)
        .deploy(ethers.utils.parseEther('1000'));

      // Set variables
      await app.setStorageAddress(hex4Bytes('ETH_RECEIVER'), bob.address);
      await app.setStorageAddress(hex4Bytes('TOKEN_RECEIVER'), alice.address);
      await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);
      await app.setStorageUint256(hex4Bytes('TOKEN_ADDR'), token.address);

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
      await app.addTxBlueprint(txId0, txs[0].requiredTxs, txs[0].signatories);
      await app.addTxCondition(
        txId0,
        txs[0].conditionStrings[0],
        txs[0].conditionContexts[0].address
      );
      await app.addTxTransaction(txId0, txs[0].transactionStr, txs[0].transactionCtx.address);

      // Set conditional transaction #2
      const { txId: txId1 } = txs[1];
      await app.addTxBlueprint(txId1, txs[1].requiredTxs, txs[1].signatories);
      await app.addTxCondition(
        txId1,
        txs[1].conditionStrings[0],
        txs[1].conditionContexts[0].address
      );
      await app.addTxTransaction(txId1, txs[1].transactionStr, txs[1].transactionCtx.address);

      // Set app addresses & msg senders
      await txs[0].transactionCtx.setAppAddress(app.address);
      await txs[0].transactionCtx.setMsgSender(alice.address);
      await txs[0].conditionContexts[0].setAppAddress(app.address);
      await txs[0].conditionContexts[0].setMsgSender(alice.address);

      await txs[1].transactionCtx.setAppAddress(app.address);
      await txs[1].transactionCtx.setMsgSender(bob.address);
      await txs[1].conditionContexts[0].setAppAddress(app.address);
      await txs[1].conditionContexts[0].setMsgSender(bob.address);

      // Parse all conditions and a transaction #1
      const condCtxLen0 = (await app.conditionContextsLen(txId0)).toNumber();
      for (let i = 0; i < condCtxLen0; i++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(txId0, i),
          await app.conditionStrings(txId0, i)
        );
      }
      await parser.parse(preprAddr, txs[0].transactionCtx.address, txs[0].transactionStr);

      // Parse all conditions and a transaction #2
      const condCtxLen1 = (await app.conditionContextsLen(txId1)).toNumber();
      for (let i = 0; i < condCtxLen1; i++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(txId1, i),
          await app.conditionStrings(txId1, i)
        );
      }
      await parser.parse(preprAddr, txs[1].transactionCtx.address, txs[1].transactionStr);

      // Top up contract (ETH)
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Top up contract (tokens)
      await token.transfer(app.address, tenTokens);
      expect(await token.balanceOf(app.address)).to.equal(tenTokens);

      // Execute transactions
      await expect(await app.execTx(txId0, 0, alice.address)).to.changeEtherBalance(bob, oneEth);
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(() => app.execTx(txId1, 0, bob.address)).to.changeTokenBalance(
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
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if `anyone` address is the first address in the list', async () => {
      const signatories = [ANYONE, bob.address, alice.address];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if `anyone` and zero addresses in the list', async () => {
      const signatories = [ethers.constants.AddressZero, ANYONE];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if `anyone` was provided twice', async () => {
      const signatories = [ANYONE, ANYONE];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });

    it('should revert if signatories was not provided', async () => {
      await expect(app.addTxBlueprint(1, [], [])).to.be.revertedWith('CNT1');
    });

    it('should revert if `zeroAddress` address is the in the list', async () => {
      const signatories = [bob.address, alice.address, ethers.constants.AddressZero];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith('CNT1');
    });
  });
});
