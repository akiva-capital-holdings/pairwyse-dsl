import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber, Contract } from 'ethers';
import { hex4Bytes } from '../utils/utils';
import { aliceAndBobSteps, aliceBobAndCarl, businessCaseSteps } from '../data/agreement';
import { Agreement } from '../../typechain/Agreement';
import { Parser } from '../../typechain/Parser';
import { ConditionalTxs, Context__factory } from '../../typechain';
import { TxObject } from '../types';

describe('Agreement', () => {
  let ContextCont: Context__factory;
  let parser: Parser;
  let agreement: Agreement;
  let whale: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let GP: SignerWithAddress;
  let LP: SignerWithAddress;
  let anybody: SignerWithAddress;
  let comparatorOpcodesLib: Contract;
  let logicalOpcodesLib: Contract;
  let setOpcodesLib: Contract;
  let otherOpcodesLib: Contract;
  let txsAddr: string;
  let txs: ConditionalTxs;
  let NEXT_MONTH: number;
  let NEXT_TWO_MONTH: number;
  let LAST_BLOCK_TIMESTAMP: number;

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;
  const ONE_YEAR = ONE_DAY * 365;

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
        step.signatory,
        step.transaction,
        step.conditions,
        txCtx.address,
        cdCtxsAddrs
      );
      console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${hash}\x1b[0m`);
    }
  };

  const businessCaseTest = (
    name: string,
    GP_INITIAL: BigNumber,
    LP_INITIAL: BigNumber,
    INITIAL_FUNDS_TARGET: BigNumber,
    TRADE_LOSS: BigNumber,
    FUND_INVESTMENT_RETURN: BigNumber,
    MANAGEMENT_FEE_PERCENTAGE: number,
    HURDLE: number,
    PROFIT_PART: number,
    GP_FAILS_TO_DO_GAP_DEPOSIT: boolean
  ) => {
    it(name, async () => {
      // Set variables
      LAST_BLOCK_TIMESTAMP = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;
      NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
      NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

      // Start the test
      if (!TRADE_LOSS.isZero() && !FUND_INVESTMENT_RETURN.isZero()) return;
      const dai = await (await ethers.getContractFactory('Token'))
        .connect(whale)
        .deploy(parseUnits('1000000', 18));

      // Note: if we try do do illegal math (try to obtain a negative value ex. 5 - 10) or divide by
      //       0 then the DSL instruction will fall

      // Add tx objects to Agreement
      console.log('\n\nUpdating Agreement Terms and Conditions...');
      await addSteps(businessCaseSteps(GP, LP), ContextCont);
      console.log('\n\nAgreement Updated with new Terms & Conditions');
      console.log('\n\nTesting Agreement Execution...\n\n');

      LAST_BLOCK_TIMESTAMP = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
      NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

      // Step 1
      console.log('\n🏃 Agreement Lifecycle - Txn #1');
      await dai.connect(whale).transfer(GP.address, GP_INITIAL);
      await dai.connect(GP).approve(txsAddr, GP_INITIAL);
      console.log(`GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);

      await txs.setStorageAddress(hex4Bytes('DAI'), dai.address);
      await txs.setStorageAddress(hex4Bytes('GP'), GP.address);
      await txs.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), txsAddr);
      await txs.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), INITIAL_FUNDS_TARGET);
      await txs.setStorageUint256(hex4Bytes('GP_INITIAL'), GP_INITIAL);
      await txs.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), NEXT_MONTH);

      const txn1 = await agreement.connect(GP).execute(1);
      console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
      console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
      console.log(`txn hash: \x1b[35m${txn1.hash}\x1b[0m`);

      // Step 2
      console.log('\n🏃 Agreement Lifecycle - Txn #2');
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await dai.connect(whale).transfer(LP.address, LP_INITIAL);
      await dai.connect(LP).approve(txsAddr, LP_INITIAL);
      console.log(`LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);

      await txs.setStorageAddress(hex4Bytes('LP'), LP.address);
      await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
      await txs.setStorageUint256(hex4Bytes('CLOSING_DATE'), NEXT_TWO_MONTH);

      const txn2 = await agreement.connect(LP).execute(2);
      console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
      console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
      console.log(`txn hash: \x1b[35m${txn2.hash}\x1b[0m`);

      let GP_REMAINING = BigNumber.from(0);
      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // Step 3
        console.log('\n🏃 Agreement Lifecycle - Txn #3');
        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH]);
        GP_REMAINING = BigNumber.from(2).mul(LP_INITIAL).div(98).sub(GP_INITIAL);
        await dai.connect(whale).transfer(GP.address, GP_REMAINING);
        await dai.connect(GP).approve(txsAddr, GP_REMAINING);
        console.log(`GP Gap Deposit = ${formatEther(GP_REMAINING)} DAI`);
        const GP_GAP_DEPOSIT_LOWER_TIME = NEXT_TWO_MONTH - ONE_DAY;
        const GP_GAP_DEPOSIT_UPPER_TIME = NEXT_TWO_MONTH + ONE_DAY;

        // Note: we give GP 2 days time to obtain a 98% / 2% ratio of LP / GP deposits
        await txs.setStorageUint256(hex4Bytes('LOW_LIM'), GP_GAP_DEPOSIT_LOWER_TIME);
        await txs.setStorageUint256(hex4Bytes('UP_LIM'), GP_GAP_DEPOSIT_UPPER_TIME);

        const txn3 = await agreement.connect(GP).execute(3);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn3.hash}\x1b[0m`);
      }

      // Step 4
      console.log('\n🏃 Agreement Lifecycle - Txn #4');
      await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 2 * ONE_DAY]);
      await txs.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), NEXT_TWO_MONTH + 7 * ONE_DAY);

      console.log(`LP withdraws LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);
      console.log(`GP withdraws GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);

      let txn4;
      if (GP_FAILS_TO_DO_GAP_DEPOSIT) {
        txn4 = await expect(() => agreement.connect(LP).execute(4)).to.changeTokenBalances(
          dai,
          [GP, LP],
          [GP_INITIAL, LP_INITIAL]
        );
      } else {
        txn4 = await expect(agreement.connect(LP).execute(4)).to.be.revertedWith(
          'Agreement: tx condition is not satisfied'
        );
        console.log(`\x1b[33m
As GP did gap deposit, LP is not allowed to withdraw the funds.
LP incurs transaction error if tries to withdraw funds after investment closing date\x1b[0m
`);
      }
      console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
      console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
      console.log(`txn hash: \x1b[35m${txn4}\x1b[0m`);
      // }

      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // Step 5
        console.log('\n🏃 Agreement Lifecycle - Txn #5');
        let DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        const PURCHASE_AMOUNT = DAI_BAL_OF_TXS.mul(9).div(10);
        console.log(`GP ETH Asset Purchase = ${formatEther(PURCHASE_AMOUNT)} DAI`);
        const FUND_INVESTMENT_DATE = NEXT_TWO_MONTH + 7 * ONE_DAY;

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 7 * ONE_DAY]);
        await txs.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), FUND_INVESTMENT_DATE);
        await txs.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT);

        const txn5 = await expect(() => agreement.connect(GP).execute(5)).to.changeTokenBalance(
          dai,
          GP,
          PURCHASE_AMOUNT
        );
        await dai.connect(GP).transfer(txsAddr, PURCHASE_AMOUNT.sub(TRADE_LOSS));
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        // console.log(`txn hash: \x1b[35m${txn5.hash}\x1b[0m`); // TODO

        // Step 6
        console.log('\n🏃 Agreement Lifecycle - Txn #6');
        const WHALE = whale.address;
        const SOME_DAI = parseUnits('0', 18);

        await ethers.provider.send('evm_setNextBlockTimestamp', [FUND_INVESTMENT_DATE + ONE_YEAR]);

        await txs.setStorageUint256(hex4Bytes('WHALE'), WHALE);
        await txs.setStorageUint256(hex4Bytes('SOME_DAI'), SOME_DAI);
        await dai.connect(whale).approve(txsAddr, SOME_DAI);
        console.log(`Fund Investment Return = ${formatEther(SOME_DAI)} DAI`);

        const txn6 = await agreement.connect(GP).execute(6);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`);

        // Step 7a
        console.log('\n🏃 Agreement Lifecycle - Txn #71');
        const MANAGEMENT_FEE = LP_INITIAL.mul(MANAGEMENT_FEE_PERCENTAGE).div(100);
        console.log(`GP Management Fee = ${formatEther(MANAGEMENT_FEE)} DAI`);

        const txn71 = await expect(() => agreement.connect(GP).execute(71)).to.changeTokenBalance(
          dai,
          GP,
          MANAGEMENT_FEE
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        // console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`); // TODO

        // Step 7b
        console.log('\n🏃 Agreement Lifecycle - Txn #72');
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        let PROFIT = DAI_BAL_OF_TXS.add(MANAGEMENT_FEE)
          .sub(GP_INITIAL)
          .sub(LP_INITIAL)
          .sub(GP_REMAINING);
        PROFIT = PROFIT.gt(0) ? PROFIT : BigNumber.from(0);
        console.log(`Fund Profit = ${formatEther(PROFIT)} DAI`);
        const THRESHOLD = LP_INITIAL.mul(HURDLE).div(100);
        const DELTA = PROFIT.gt(0) ? PROFIT.sub(THRESHOLD) : BigNumber.from(0);
        const CARRY = DELTA.mul(PROFIT_PART).div(100);

        console.log(`GP Carry Charge = ${formatEther(CARRY)} DAI`);

        await txs.setStorageUint256(hex4Bytes('HURDLE'), HURDLE);
        await txs.setStorageUint256(hex4Bytes('PROFIT_PART'), PROFIT_PART);

        const txn72 = await expect(() => agreement.connect(GP).execute(72)).to.changeTokenBalance(
          dai,
          GP,
          CARRY
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        // console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`); // TODO

        // Step 7c
        console.log('\n🏃 Agreement Lifecycle - Txn #73');
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        const LOSS = PROFIT.gt(0)
          ? BigNumber.from(0)
          : GP_INITIAL.add(LP_INITIAL).add(GP_REMAINING).sub(DAI_BAL_OF_TXS).sub(MANAGEMENT_FEE);
        console.log(`Fund Total Loss = ${formatEther(LOSS)} DAI`);
        const GP_PRINICIPAL = LOSS.gt(GP_INITIAL.add(GP_REMAINING))
          ? BigNumber.from(0)
          : GP_INITIAL.add(GP_REMAINING).sub(LOSS);
        console.log(`GP Principal = ${formatEther(GP_PRINICIPAL)} DAI`);

        const txn73 = await expect(() => agreement.connect(GP).execute(73)).to.changeTokenBalance(
          dai,
          GP,
          GP_PRINICIPAL
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        // console.log(`txn hash: \x1b[35m${txn73.hash}\x1b[0m`); // TODO

        // Step 8a
        console.log('\n🏃 Agreement Lifecycle - Txn #81');
        const LP_PROFIT = PROFIT.gt(0) ? PROFIT.sub(CARRY) : 0;
        console.log(`LP Investment Profit = ${formatEther(LP_PROFIT)} DAI`);
        const txn81 = await expect(() => agreement.connect(LP).execute(81)).to.changeTokenBalance(
          dai,
          LP,
          LP_PROFIT
        );
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        console.log(`Cash Balance = ${formatEther(DAI_BAL_OF_TXS)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        // console.log(`txn hash: \x1b[35m${txn81.hash}\x1b[0m`); // TODO

        // Step 8b
        console.log('\n🏃 Agreement Lifecycle - Txn #82');

        const UNCOVERED_NET_LOSSES = GP_INITIAL.sub(GP_REMAINING).gte(LOSS)
          ? BigNumber.from(0)
          : LOSS.sub(GP_INITIAL).sub(GP_REMAINING);
        console.log(`Uncovered Net Losses = ${formatEther(UNCOVERED_NET_LOSSES)} DAI`);
        const LP_PRINCIPAL = LP_INITIAL.sub(MANAGEMENT_FEE).sub(UNCOVERED_NET_LOSSES);
        console.log(`LP Principal = ${formatEther(LP_PRINCIPAL)} DAI`);

        const txn82 = await expect(() => agreement.connect(LP).execute(82)).to.changeTokenBalance(
          dai,
          LP,
          LP_PRINCIPAL
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        // console.log(`txn hash: \x1b[35m${txn82.hash}\x1b[0m`); // TODO
        // }

        // No funds should left on Agreement
        expect(await dai.balanceOf(txsAddr)).to.equal(0);
      }
    });
  };

  before(async () => {
    [whale, alice, bob, carl, GP, LP, anybody] = await ethers.getSigners();

    LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
    NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

    ContextCont = await ethers.getContractFactory('Context');

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    });
    parser = await ParserCont.deploy();
  });

  beforeEach(async () => {
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
    // Deploy Agreement
    agreement = await (
      await ethers.getContractFactory('Agreement', {
        libraries: {
          ComparatorOpcodes: comparatorOpcodesLib.address,
          LogicalOpcodes: logicalOpcodesLib.address,
          SetOpcodes: setOpcodesLib.address,
          OtherOpcodes: otherOpcodesLib.address,
          Executor: executorLib.address,
        },
      })
    ).deploy(parser.address);

    txsAddr = await agreement.txs();
    txs = await ethers.getContractAt('ConditionalTxs', txsAddr);
  });

  it('one condition', async () => {
    // Set variables
    await txs.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await txs.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const txId = 1;
    const requiredTxs: number[] = [];
    const signatory = alice.address;
    const conditions = ['blockTimestamp > loadLocal uint256 LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';

    // Update
    await addSteps([{ txId, requiredTxs, signatory, conditions, transaction }], ContextCont);

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

    // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, oneEthBN);

    // Tx already executed
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );
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
  });

  describe('Lifecycle Test', () => {
    businessCaseTest(
      'Scenario 1:  LP deposits; GP balances; Profit Realized',
      parseUnits('20', 18), // GP_INITIAL
      parseUnits('990', 18), // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
    businessCaseTest(
      'Scenario 2:  GP fails to balance LP deposit',
      parseUnits('20', 18), // GP_INITIAL
      parseUnits('990', 18), // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      true // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
    businessCaseTest(
      'Scenario 3:  Loss incurred, fully covered by GP',
      parseUnits('20', 18), // GP_INITIAL
      parseUnits('990', 18), // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('10', 18), // CAPITAL_LOSS
      parseUnits('0', 18), // CAPITAL_GAINS
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
    businessCaseTest(
      'Scenario 4:  Loss incurred, not fully covered by GP',
      parseUnits('20', 18), // GP_INITIAL
      parseUnits('990', 18), // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('100', 18), // CAPITAL_LOSS
      parseUnits('0', 18), // CAPITAL_GAINS
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
  });
});
