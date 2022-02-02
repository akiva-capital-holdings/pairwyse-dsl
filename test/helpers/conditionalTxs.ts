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

  const ONE_MONTH = 60 * 60 * 24 * 30;
  let NEXT_MONTH: number;

  type Txs = {
    signatory: string;
    transactionStr: string;
    conditionStr: string;
    transactionCtx: Context;
    conditionCtx: Context;
  };

  let txs: Txs[] = [];

  before(async () => {
    [alice, bob, anybody] = await ethers.getSigners();

    const lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;

    // Deploy libraries
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const opcodesLib = await (await ethers.getContractFactory('Opcodes')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy contracts
    ContextCont = await ethers.getContractFactory('Context');
    app = await (
      await ethers.getContractFactory('ConditionalTxs', {
        libraries: {
          Opcodes: opcodesLib.address,
          Executor: executorLib.address,
        },
      })
    ).deploy();
    parser = await (
      await ethers.getContractFactory('Parser', {
        libraries: {
          StringUtils: stringLib.address,
        },
      })
    ).deploy();
  });

  afterEach(() => {
    txs = [];
  });

  it('test one transaction', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    txs.push({
      signatory: alice.address,
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStr: 'blockTimestamp > loadLocal uint256 LOCK_TIME',
      transactionCtx: await ContextCont.deploy(),
      conditionCtx: await ContextCont.deploy(),
    });

    // Set conditional transaction
    const txId = await app.callStatic.addTx(
      txs[0].signatory,
      txs[0].transactionStr,
      txs[0].conditionStr,
      txs[0].transactionCtx.address,
      txs[0].conditionCtx.address
    );
    await app.addTx(
      txs[0].signatory,
      txs[0].transactionStr,
      txs[0].conditionStr,
      txs[0].transactionCtx.address,
      txs[0].conditionCtx.address
    );

    // Setup
    await parser.initOpcodes(txs[0].transactionCtx.address);
    await parser.initOpcodes(txs[0].conditionCtx.address);

    await txs[0].transactionCtx.setAppAddress(app.address);
    await txs[0].transactionCtx.setMsgSender(alice.address);

    await txs[0].conditionCtx.setAppAddress(app.address);
    await txs[0].conditionCtx.setMsgSender(alice.address);

    const txn = await app.txs(txId);

    await parser.parse(txn.transactionCtx, txn.transactionStr);
    await parser.parse(txn.conditionCtx, txn.conditionStr);

    // Top up contract
    const oneEthBN = ethers.utils.parseEther('1');
    await anybody.sendTransaction({ to: app.address, value: oneEthBN });

    // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await app.connect(alice).execTx(txId, 0)).to.changeEtherBalance(bob, oneEthBN);
  });

  it('test two transactions', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('ETH_RECEIVER'), bob.address);
    await app.setStorageAddress(hex4Bytes('TOKEN_RECEIVER'), alice.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);
    const oneEth = ethers.utils.parseEther('1');
    const tenTokens = ethers.utils.parseEther('10');

    // Deploy Token contract
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(ethers.utils.parseEther('1000'));

    txs.push({
      signatory: alice.address,
      transactionStr: 'sendEth ETH_RECEIVER 1000000000000000000',
      conditionStr: 'bool true',
      transactionCtx: await ContextCont.deploy(),
      conditionCtx: await ContextCont.deploy(),
    });
    txs.push({
      signatory: bob.address,
      transactionStr: `transfer ${token.address.substring(
        2
      )} TOKEN_RECEIVER ${tenTokens.toString()}`,
      conditionStr: 'blockTimestamp > loadLocal uint256 LOCK_TIME',
      transactionCtx: await ContextCont.deploy(),
      conditionCtx: await ContextCont.deploy(),
    });

    // Set conditional transaction
    const txId1 = await app.callStatic.addTx(
      txs[0].signatory,
      txs[0].transactionStr,
      txs[0].conditionStr,
      txs[0].transactionCtx.address,
      txs[0].conditionCtx.address
    );
    await app.addTx(
      txs[0].signatory,
      txs[0].transactionStr,
      txs[0].conditionStr,
      txs[0].transactionCtx.address,
      txs[0].conditionCtx.address
    );

    // Set conditional transaction
    const txId2 = await app.callStatic.addTx(
      txs[1].signatory,
      txs[1].transactionStr,
      txs[1].conditionStr,
      txs[1].transactionCtx.address,
      txs[1].conditionCtx.address
    );
    await app.addTx(
      txs[1].signatory,
      txs[1].transactionStr,
      txs[1].conditionStr,
      txs[1].transactionCtx.address,
      txs[1].conditionCtx.address
    );

    // Setup
    await parser.initOpcodes(txs[0].transactionCtx.address);
    await parser.initOpcodes(txs[0].conditionCtx.address);

    await txs[0].transactionCtx.setAppAddress(app.address);
    await txs[0].transactionCtx.setMsgSender(alice.address);

    await txs[0].conditionCtx.setAppAddress(app.address);
    await txs[0].conditionCtx.setMsgSender(alice.address);

    await parser.initOpcodes(txs[1].transactionCtx.address);
    await parser.initOpcodes(txs[1].conditionCtx.address);

    await txs[1].transactionCtx.setAppAddress(app.address);
    await txs[1].transactionCtx.setMsgSender(bob.address);

    await txs[1].conditionCtx.setAppAddress(app.address);
    await txs[1].conditionCtx.setMsgSender(bob.address);

    const txn1 = await app.txs(txId1);
    const txn2 = await app.txs(txId2);

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
    await expect(await app.connect(alice).execTx(txId1, 0)).to.changeEtherBalance(bob, oneEth);
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(() => app.connect(bob).execTx(txId2, 0)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );
  });
});
