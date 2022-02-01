import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ConditionalTxs, Parser } from '../../typechain';
import { hex4Bytes } from '../utils/utils';

describe.only('Conditional transactions', () => {
  let app: ConditionalTxs;
  let parser: Parser;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;

  const ONE_MONTH = 60 * 60 * 24 * 30;
  let NEXT_MONTH: number;

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

  it('test one transaction', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    // Deploy required contracts
    const ContextCont = await ethers.getContractFactory('Context');
    const transactionCtx = await ContextCont.deploy();
    const conditionCtx = await ContextCont.deploy();

    // Set conditional transaction
    const txId = await app.callStatic.addTx(
      alice.address,
      'sendEth RECEIVER 1000000000000000000',
      'blockTimestamp > loadLocal uint256 LOCK_TIME',
      transactionCtx.address,
      conditionCtx.address
    );
    await app.addTx(
      alice.address,
      'sendEth RECEIVER 1000000000000000000',
      'blockTimestamp > loadLocal uint256 LOCK_TIME',
      transactionCtx.address,
      conditionCtx.address
    );

    // Setup
    await parser.initOpcodes(transactionCtx.address);
    await parser.initOpcodes(conditionCtx.address);

    await transactionCtx.setAppAddress(app.address);
    await transactionCtx.setMsgSender(alice.address);

    await conditionCtx.setAppAddress(app.address);
    await conditionCtx.setMsgSender(alice.address);

    const txn = await app.txs(txId);

    await parser.parse(txn.transactionCtx, txn.transactionStr);
    await parser.parse(txn.conditionCtx, txn.conditionStr);

    // Top up contract
    const oneEthBN = ethers.utils.parseEther('1');
    await anybody.sendTransaction({ to: app.address, value: oneEthBN });

    // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await app.connect(alice).execTransaction(txId)).to.changeEtherBalance(
      bob,
      oneEthBN
    );
  });
});
