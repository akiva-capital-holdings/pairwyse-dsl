import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ConditionalTxsMock } from '../../typechain-types/agreement/mocks';
import { Context, Context__factory, Parser } from '../../typechain-types';
import { hex4Bytes } from '../utils/utils';

describe('Conditional transactions', () => {
  let app: ConditionalTxsMock;
  let parser: Parser;
  let ContextCont: Context__factory;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;

  const ONE_MONTH = 60 * 60 * 24 * 30;
  const anyone = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';

  type Txs = {
    txId: number;
    requiredTxs: number[];
    signatories: string[];
    transactionStr: string;
    conditionStrs: string[];
    transactionCtx: Context;
    conditionCtxs: Context[];
  };

  let txs: Txs[] = [];

  before(async () => {
    const lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;

    [alice, bob, anybody] = await ethers.getSigners();

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparisonOpcodesLib = await (
      await ethers.getContractFactory('ComparisonOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const branchingOpcodesLib = await (
      await ethers.getContractFactory('BranchingOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy contracts
    ContextCont = await ethers.getContractFactory('Context');
    const preprocessor = await (
      await ethers.getContractFactory('Preprocessor', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();
    app = (await (
      await ethers.getContractFactory('ConditionalTxs', {
        libraries: {
          ComparisonOpcodes: comparisonOpcodesLib.address,
          BranchingOpcodes: branchingOpcodesLib.address,
          LogicalOpcodes: logicalOpcodesLib.address,
          OtherOpcodes: otherOpcodesLib.address,
          Executor: executorLib.address,
        },
      })
    ).deploy()) as ConditionalTxsMock;
    parser = await (
      await ethers.getContractFactory('Parser', {
        libraries: {
          StringUtils: stringLib.address,
          ByteUtils: byteLib.address,
        },
      })
    ).deploy(preprocessor.address);

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

    txs.push({
      txId: 1,
      requiredTxs: [],
      signatories: [alice.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrs: ['blockTimestamp > loadLocal uint256 LOCK_TIME'],
      transactionCtx: await ContextCont.deploy(),
      conditionCtxs: [await ContextCont.deploy()],
    });

    // Set conditional transaction
    for (let i = 0; i < txs.length; i++) {
      const {
        txId,
        requiredTxs,
        signatories,
        conditionCtxs,
        conditionStrs,
        transactionCtx,
        transactionStr,
      } = txs[i];

      // Set conditional transaction
      await app.addTxBlueprint(txId, requiredTxs, signatories);
      for (let j = 0; j < conditionCtxs.length; j++) {
        await app.addTxCondition(txId, conditionStrs[j], conditionCtxs[j].address);
      }
      await app.addTxTransaction(txId, transactionStr, transactionCtx.address);

      // Setup

      // Init all opcodes
      await transactionCtx.initOpcodes();
      await conditionCtxs[0].initOpcodes();

      // Set app addresses & msg senders
      await transactionCtx.setAppAddress(app.address);
      await transactionCtx.setMsgSender(alice.address);
      await conditionCtxs[0].setAppAddress(app.address);
      await conditionCtxs[0].setMsgSender(alice.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionCtxsLen(txId)).toNumber();
      expect(condCtxLen).to.equal(1);
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(await app.conditionCtxs(txId, j), await app.conditionStrs(txId, j));
      }
      await parser.parse(transactionCtx.address, transactionStr);

      // Top up contract
      const oneEthBN = ethers.utils.parseEther('1');
      await anybody.sendTransaction({ to: app.address, value: oneEthBN });

      // Execute transaction
      await expect(app.execTx(txId, 0, alice.address)).to.be.revertedWith(
        'ConditionalTxs: txn condition is not satisfied'
      );
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(await app.execTx(txId, 0, alice.address)).to.changeEtherBalance(bob, oneEthBN);
      await expect(app.execTx(txId, 0, alice.address)).to.be.revertedWith(
        'ConditionalTxs: txn already was executed'
      );
    }
  });

  describe('Scenarios', () => {
    it('borrower/lender scenario', async () => {
      // Deploy Token contract
      const token = await (await ethers.getContractFactory('Token'))
        .connect(bob)
        .deploy(ethers.utils.parseEther('1000'));

      // Set variables
      const oneEth = ethers.utils.parseEther('1');
      const tenTokens = ethers.utils.parseEther('10');
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
        conditionStrs: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionCtxs: [await ContextCont.deploy()],
      });
      txs.push({
        txId: 2,
        requiredTxs: [],
        signatories: [bob.address],
        transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens}`,
        conditionStrs: ['blockTimestamp > loadLocal uint256 LOCK_TIME'],
        transactionCtx: await ContextCont.deploy(),
        conditionCtxs: [await ContextCont.deploy()],
      });

      // Set conditional transaction #1
      const { txId: txId0 } = txs[0];
      await app.addTxBlueprint(txId0, txs[0].requiredTxs, txs[0].signatories);
      await app.addTxCondition(txId0, txs[0].conditionStrs[0], txs[0].conditionCtxs[0].address);
      await app.addTxTransaction(txId0, txs[0].transactionStr, txs[0].transactionCtx.address);

      // Set conditional transaction #2
      const { txId: txId1 } = txs[1];
      await app.addTxBlueprint(txId1, txs[1].requiredTxs, txs[1].signatories);
      await app.addTxCondition(txId1, txs[1].conditionStrs[0], txs[1].conditionCtxs[0].address);
      await app.addTxTransaction(txId1, txs[1].transactionStr, txs[1].transactionCtx.address);

      // Setup

      // Init all opcodes
      await txs[0].transactionCtx.initOpcodes();
      await txs[0].conditionCtxs[0].initOpcodes();
      await txs[1].transactionCtx.initOpcodes();
      await txs[1].conditionCtxs[0].initOpcodes();

      // Set app addresses & msg senders
      await txs[0].transactionCtx.setAppAddress(app.address);
      await txs[0].transactionCtx.setMsgSender(alice.address);
      await txs[0].conditionCtxs[0].setAppAddress(app.address);
      await txs[0].conditionCtxs[0].setMsgSender(alice.address);

      await txs[1].transactionCtx.setAppAddress(app.address);
      await txs[1].transactionCtx.setMsgSender(bob.address);
      await txs[1].conditionCtxs[0].setAppAddress(app.address);
      await txs[1].conditionCtxs[0].setMsgSender(bob.address);

      // Parse all conditions and a transaction #1
      const condCtxLen0 = (await app.conditionCtxsLen(txId0)).toNumber();
      for (let i = 0; i < condCtxLen0; i++) {
        await parser.parse(await app.conditionCtxs(txId0, i), await app.conditionStrs(txId0, i));
      }
      await parser.parse(txs[0].transactionCtx.address, txs[0].transactionStr);

      // Parse all conditions and a transaction #2
      const condCtxLen1 = (await app.conditionCtxsLen(txId1)).toNumber();
      for (let i = 0; i < condCtxLen1; i++) {
        await parser.parse(await app.conditionCtxs(txId1, i), await app.conditionStrs(txId1, i));
      }
      await parser.parse(txs[1].transactionCtx.address, txs[1].transactionStr);

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
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    it('should revert if `anyone` address is the last address in the list', async () => {
      // it not possible to update transaction with alice, bobo and 0xFfFF address
      const signatories = [alice.address, bob.address, anyone];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith(
        'ConditionalTxs: signatures are invalid'
      );
    });

    it('should revert if `anyone` address is the first address in the list', async () => {
      const signatories = [anyone, bob.address, alice.address];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith(
        'ConditionalTxs: signatures are invalid'
      );
    });

    it('should revert if `anyone` and zero addresses in the list', async () => {
      const signatories = [zeroAddress, anyone];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith(
        'ConditionalTxs: signatures are invalid'
      );
    });

    it('should revert if `anyone` was provided twice', async () => {
      const signatories = [anyone, anyone];
      await expect(app.addTxBlueprint(1, [], signatories)).to.be.revertedWith(
        'ConditionalTxs: signatures are invalid'
      );
    });

    // TODO: (by Yevheniia) check specification with Misha
    // it('should revert if signatories was not provided',
    //   async () => {
    //     await expect(app.addTxBlueprint(1, [], [])).to.be.revertedWith(
    //       'ConditionalTxs: signatures are invalid'
    //     );
    //   }
    // );
  });
});
