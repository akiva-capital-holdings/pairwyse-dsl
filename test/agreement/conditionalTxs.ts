import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ConditionalTxs, Context, Context__factory, Parser } from '../../typechain';
import { hex4Bytes } from '../utils/utils';

describe('Conditional transactions', () => {
  let app: ConditionalTxs;
  let parser: Parser;
  let ContextCont: Context__factory;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;

  const ONE_MONTH = 60 * 60 * 24 * 30;

  type Txs = {
    txId: number;
    requiredTxs: number[];
    signatory: string;
    transactionStr: string;
    conditionStr: string;
    transactionCtx: Context;
    conditionCtx: Context;
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
    const comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
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
    const setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
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
    app = await (
      await ethers.getContractFactory('ConditionalTxs', {
        libraries: {
          ComparatorOpcodes: comparatorOpcodesLib.address,
          LogicalOpcodes: logicalOpcodesLib.address,
          SetOpcodes: setOpcodesLib.address,
          OtherOpcodes: otherOpcodesLib.address,
          Executor: executorLib.address,
        },
      })
    ).deploy();
    parser = await (
      await ethers.getContractFactory('Parser', {
        libraries: {
          StringUtils: stringLib.address,
          ByteUtils: byteLib.address,
        },
      })
    ).deploy();
  });

  afterEach(() => {
    txs = [];
  });

  it.skip('test one transaction', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    txs.push({
      txId: 1,
      requiredTxs: [],
      signatory: alice.address,
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStr: 'blockTimestamp > loadLocal uint256 LOCK_TIME',
      transactionCtx: await ContextCont.deploy(),
      conditionCtx: await ContextCont.deploy(),
    });

    // Set conditional transaction
    await app.addTx(
      txs[0].txId,
      txs[0].requiredTxs,
      txs[0].signatory,
      txs[0].transactionStr,
      txs[0].conditionStr,
      txs[0].transactionCtx.address,
      txs[0].conditionCtx.address
    );

    // Setup
    const txCtx = await ethers.getContractAt('Context', txs[0].transactionCtx.address);
    const cdCtx = await ethers.getContractAt('Context', txs[0].conditionCtx.address);

    await txCtx.initOpcodes();
    await cdCtx.initOpcodes();

    await txs[0].transactionCtx.setAppAddress(app.address);
    await txs[0].transactionCtx.setMsgSender(alice.address);

    await txs[0].conditionCtx.setAppAddress(app.address);
    await txs[0].conditionCtx.setMsgSender(alice.address);

    const txn = await app.txs(txs[0].txId);

    await parser.parse(txn.transactionCtx, txn.transactionStr);
    await parser.parse(txn.conditionCtx, txn.conditionStr);

    // Top up contract
    const oneEthBN = ethers.utils.parseEther('1');
    await anybody.sendTransaction({ to: app.address, value: oneEthBN });

    // Execute transaction
    await expect(app.connect(alice).execTx(txs[0].txId, 0)).to.be.revertedWith(
      'ConditionalTxs: txn condition is not satisfied'
    );
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await app.connect(alice).execTx(txs[0].txId, 0)).to.changeEtherBalance(
      bob,
      oneEthBN
    );
    // await expect(app.connect(alice).execTx(txs[0].txId, 0)).to.be.revertedWith(
    //   'ConditionalTxs: txn already was executed'
    // );
  });

  it('test two transactions', async () => {
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

    txs.push({
      txId: 1,
      requiredTxs: [],
      signatory: alice.address,
      transactionStr: 'sendEth ETH_RECEIVER 1000000000000000000',
      conditionStr: 'bool true',
      transactionCtx: await ContextCont.deploy(),
      conditionCtx: await ContextCont.deploy(),
    });
    txs.push({
      txId: 2,
      requiredTxs: [],
      signatory: bob.address,
      transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens.toString()}`,
      conditionStr: 'blockTimestamp > loadLocal uint256 LOCK_TIME',
      transactionCtx: await ContextCont.deploy(),
      conditionCtx: await ContextCont.deploy(),
    });

    // Set conditional transaction
    await app.addTx(
      txs[0].txId,
      txs[0].requiredTxs,
      txs[0].signatory,
      txs[0].transactionStr,
      txs[0].conditionStr,
      txs[0].transactionCtx.address,
      txs[0].conditionCtx.address
    );

    // Set conditional transaction
    await app.addTx(
      txs[1].txId,
      txs[1].requiredTxs,
      txs[1].signatory,
      txs[1].transactionStr,
      txs[1].conditionStr,
      txs[1].transactionCtx.address,
      txs[1].conditionCtx.address
    );

    // Setup
    const txCtx0 = await ethers.getContractAt('Context', txs[0].transactionCtx.address);
    const cdCtx0 = await ethers.getContractAt('Context', txs[0].conditionCtx.address);

    await txCtx0.initOpcodes();
    await cdCtx0.initOpcodes();

    await txs[0].transactionCtx.setAppAddress(app.address);
    await txs[0].transactionCtx.setMsgSender(alice.address);

    await txs[0].conditionCtx.setAppAddress(app.address);
    await txs[0].conditionCtx.setMsgSender(alice.address);

    const txCtx1 = await ethers.getContractAt('Context', txs[1].transactionCtx.address);
    const cdCtx1 = await ethers.getContractAt('Context', txs[1].conditionCtx.address);

    await txCtx1.initOpcodes();
    await cdCtx1.initOpcodes();

    await txs[1].transactionCtx.setAppAddress(app.address);
    await txs[1].transactionCtx.setMsgSender(bob.address);

    await txs[1].conditionCtx.setAppAddress(app.address);
    await txs[1].conditionCtx.setMsgSender(bob.address);

    const txn1 = await app.txs(txs[0].txId);
    const txn2 = await app.txs(txs[1].txId);

    await parser.parse(txn1.transactionCtx, txn1.transactionStr);
    await parser.parse(txn1.conditionCtx, txn1.conditionStr);
    await parser.parse(txn2.transactionCtx, txn2.transactionStr);
    await parser.parse(txn2.conditionCtx, txn2.conditionStr);

    // Top up contract (ETH)
    await anybody.sendTransaction({ to: app.address, value: oneEth });

    // Top up contract (tokens)
    await token.transfer(app.address, tenTokens);
    expect(await token.balanceOf(app.address)).to.equal(tenTokens);

    // Execute transactions
    await expect(await app.connect(alice).execTx(txs[0].txId, 0)).to.changeEtherBalance(
      bob,
      oneEth
    );
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(() => app.connect(bob).execTx(txs[1].txId, 0)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );
  });
});
