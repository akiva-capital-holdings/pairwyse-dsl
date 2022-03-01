import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber, Contract } from 'ethers';
import { hex4Bytes } from '../utils/utils';
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

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;

  // Add tx objects to Agreement
  const addSteps = async (steps: TxObject[], Ctx: Context__factory) => {
    const txIds: string[] = [];
    let txCtx;
    let cdCtx;

    for await (const step of steps) {
      txCtx = await Ctx.deploy();
      cdCtx = await Ctx.deploy();
      txIds.push(
        await agreement.callStatic.update(
          step.signatory,
          step.transaction,
          step.condition,
          txCtx.address,
          cdCtx.address
        )
      );
      await agreement.update(
        step.signatory,
        step.transaction,
        step.condition,
        txCtx.address,
        cdCtx.address
      );
    }

    return txIds;
  };

  before(async () => {
    [whale, alice, bob, carl, GP, LP, anybody] = await ethers.getSigners();

    const lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + ONE_MONTH;
    NEXT_TWO_MONTH = lastBlockTimestamp + 2 * ONE_MONTH;

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

    const signatory = alice.address;
    const condition = 'blockTimestamp > loadLocal uint256 LOCK_TIME';
    const transaction = 'sendEth RECEIVER 1000000000000000000';

    // Update
    const txIds = await addSteps([{ signatory, condition, transaction }], ContextCont);
    const txId = txIds[0];

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

    const steps = [
      // Alice deposits 1 ETH to SC
      {
        signatory: alice.address,
        transaction: `
              (msgValue == uint256 ${oneEth})
          and (setLocalBool BORROWER_DEPOSITED true)`,
        condition: 'loadLocal bool BORROWER_DEPOSITED == bool false',
      },
      // Bob lends 10 tokens to Alice
      {
        signatory: bob.address,
        transaction: `
              (transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()})
          and (setLocalBool LENDER_DEPOSITED true)
        `,
        condition: `
              (loadLocal bool BORROWER_DEPOSITED == bool true)
          and (loadLocal bool LENDER_DEPOSITED == bool false)
        `,
      },
      // Alice returns 10 tokens to Bob and collects 1 ETH
      {
        signatory: alice.address,
        transaction: `
              (transferFrom TOKEN_ADDR ALICE BOB ${tenTokens.toString()})
          and (sendEth ALICE ${oneEth})
          and (setLocalBool OBLIGATIONS_SETTLED true)
        `,
        condition: `
              (loadLocal bool LENDER_DEPOSITED == bool true)
          and (loadLocal bool OBLIGATIONS_SETTLED == bool false)
        `,
      },
    ];

    // Add tx objects to Agreement
    const txIds = await addSteps(steps, ContextCont);

    // Alice deposits 1 ETH to SC
    // await expect(agreement.connect(alice).execute(txIds[0], { value: 0 })).to.be.revertedWith(
    //   'Agreement: tx fulfilment error'
    // );
    // await expect(
    //   agreement.connect(alice).execute(txIds[0], { value: parseEther('2') })
    // ).to.be.revertedWith('Agreement: tx fulfilment error');
    // console.log('Alice deposits 1 ETH to SC');
    await agreement.connect(alice).execute(txIds[0], { value: oneEth });
    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEth);

    // Bob lends 10 tokens to Alice
    // console.log('Bob lends 10 tokens to Alice');
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(txIds[1])).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    // console.log('Alice returns 10 tokens to Bob and collects 1 ETH');
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(txIds[2])).to.changeEtherBalance(
      alice,
      oneEth
    );
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

    const steps = [
      // Alice deposits 1 ETH to SC
      {
        signatory: alice.address,
        transaction: `
              (msgValue == uint256 ${oneEth})
          and (setLocalBool BORROWER_DEPOSITED true)`,
        condition: 'loadLocal bool BORROWER_DEPOSITED == bool false',
      },
      // Carl deposits 10 tokens to Agreement
      {
        signatory: carl.address,
        transaction: `
              (transferFrom TOKEN_ADDR CARL TRANSACTIONS ${tenTokens.toString()})
          and (setLocalBool INSURER_DEPOSITED true)
        `,
        condition: 'loadLocal bool INSURER_DEPOSITED == bool false',
      },
      // Bob lends 10 tokens to Alice
      {
        signatory: bob.address,
        transaction: `
              (transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()})
          and (setLocalBool LENDER_DEPOSITED true)
        `,
        condition: `
              (loadLocal bool BORROWER_DEPOSITED == bool true)
          and (loadLocal bool LENDER_DEPOSITED == bool false)
        `,
      },
      // Alice returns 10 tokens to Bob and collects 1 ETH
      {
        signatory: alice.address,
        transaction: `
              (transferFrom TOKEN_ADDR ALICE BOB ${tenTokens.toString()})
          and (sendEth ALICE ${oneEth})
          and (setLocalBool OBLIGATIONS_SETTLED true)
        `,
        condition: `
              (loadLocal bool LENDER_DEPOSITED == bool true)
          and (loadLocal bool OBLIGATIONS_SETTLED == bool false)
        `,
      },
      // If Alice didn't return 10 tokens to Bob before EXPIRY
      // then Bob can collect 10 tokens from Carl
      {
        signatory: bob.address,
        transaction: `
              (transfer TOKEN_ADDR BOB ${tenTokens.toString()})
          and (setLocalBool LENDER_WITHDRAW_INSURERS true)
        `,
        condition: `
              (blockTimestamp > loadLocal uint256 EXPIRY)
          and (loadLocal bool OBLIGATIONS_SETTLED == bool false)
          and (loadLocal bool LENDER_WITHDRAW_INSURERS == bool false)
        `,
      },
      // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
      {
        signatory: carl.address,
        transaction: `
              (transfer TOKEN_ADDR CARL ${tenTokens.toString()})
          and (setLocalBool INSURER_RECEIVED_TOKENS_BACK true)
        `,
        condition: `
              (blockTimestamp > loadLocal uint256 EXPIRY)
          and (loadLocal bool LENDER_WITHDRAW_INSURERS == bool false)
          and (loadLocal bool INSURER_RECEIVED_TOKENS_BACK == bool false)`,
      },
    ];

    // Add tx objects to Agreement
    const txIds = await addSteps(steps, ContextCont);

    // Alice deposits 1 ETH to SC
    console.log('Alice deposits 1 ETH to SC');
    await agreement.connect(alice).execute(txIds[0], { value: oneEth });
    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEth);

    // Carl deposits 10 tokens to SC
    console.log('Carl deposits 10 tokens to SC');
    // console.log((await token.balanceOf(carl.address)).toString());
    await token.connect(carl).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(carl).execute(txIds[1])).to.changeTokenBalance(
      token,
      txs,
      tenTokens
    );

    // Bob lends 10 tokens to Alice
    console.log('Bob lends 10 tokens to Alice');
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(txIds[2])).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    // console.log('Alice returns 10 tokens to Bob and collects 1 ETH');
    // expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    // await token.connect(alice).approve(txsAddr, tenTokens);
    // await expect(await agreement.connect(alice).execute(txIds[3])).to.changeEtherBalance(
    //   alice,
    //   oneEth
    // );
    // expect(await token.balanceOf(alice.address)).to.equal(0);

    // If Alice didn't return 10 tokens to Bob before EXPIRY
    // then Bob can collect 10 tokens from Carl
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    console.log(
      'If Alice didn not return 10 tokens to Bob before EXPIRY then ' +
        'Bob can collect 10 tokens from Carl'
    );
    await expect(() => agreement.connect(bob).execute(txIds[4])).to.changeTokenBalance(
      token,
      bob,
      tenTokens
    );

    // // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
    // await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // console.log('If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens');
    // await expect(() => agreement.connect(carl).execute(txIds[5])).to.changeTokenBalance(
    //   token,
    //   carl,
    //   tenTokens
    // );
  });

  it.only('Business case', async () => {
    const dai = await (await ethers.getContractFactory('Token'))
      .connect(whale)
      .deploy(parseUnits('1000000', 18));

    // TODO: make sure the steps order is perceived
    const steps = [
      // 1
      {
        signatory: GP.address,
        transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_DEPOSIT_AMOUNT',
        condition: `
              (blockTimestamp < loadLocal uint256 PLACEMENT_DATE)
          and (
            loadLocal uint256 GP_DEPOSIT_AMOUNT >=
            loadLocal uint256 ((INITIAL_FUNDS_TARGET * uint256 2) / uint256 100)
          )`,
      },
      // 2
      // Note: for now we're assuming that we have only one LP
      {
        signatory: LP.address,
        transaction: `
          transferFromVar DAI LP TRANSACTIONS_CONT LP_DEPOSIT_AMOUNT
        `,
        condition: `
          (blockTimestamp >= loadLocal uint256 PLACEMENT_DATE)
          and
          (blockTimestamp < loadLocal uint256 CLOSING_DATE)
        `,
      },
      // 3
      {
        signatory: GP.address,
        transaction: `
          transferFromVar DAI GP TRANSACTIONS_CONT REMAINING
        `,
        condition: `(blockTimestamp >= loadLocal uint256 CLOSING_DATE_MINUS_ONE_DAY)
            and
        (blockTimestamp <= loadLocal uint256 CLOSING_DATE_PLUS_ONE_DAY)
          and
        (balanceOf DAI TRANSACTIONS_CONT >=
            ((loadLocal uint256 INITIAL_FUNDS_TARGET * uint256 98) / uint256 100)
          )
        `,
      },
      // 4
      {
        signatory: LP.address, // TODO: make available for anyone?
        transaction: `
          (transferVar DAI GP GP_DEPOSIT_AMOUNT)
          and
          (transferVar DAI LP LP_DEPOSIT_AMOUNT)`,
        condition: `
          (blockTimestamp > loadLocal uint256 CLOSING_DATE_PLUS_ONE_DAY)
          and
          (blockTimestamp < loadLocal uint256 FUND_INVESTMENT_DATE)
        `,
      },
    ];

    // Add tx objects to Agreement
    const txIds = await addSteps(steps, ContextCont);

    // Step 1
    console.log('Step 1');
    const GP_DEPOSIT_AMOUNT = parseUnits('20', 18);
    await dai.connect(whale).transfer(GP.address, GP_DEPOSIT_AMOUNT);
    await dai.connect(GP).approve(txsAddr, GP_DEPOSIT_AMOUNT);

    await txs.setStorageAddress(hex4Bytes('DAI'), dai.address);
    await txs.setStorageAddress(hex4Bytes('GP'), GP.address);
    await txs.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), txsAddr);
    await txs.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), parseUnits('1000', 18));
    await txs.setStorageUint256(hex4Bytes('GP_DEPOSIT_AMOUNT'), GP_DEPOSIT_AMOUNT);
    await txs.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), NEXT_MONTH);

    await agreement.connect(GP).execute(txIds[0]);

    // Step 2
    console.log('Step 2');
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    const LP_DEPOSIT_AMOUNT = parseUnits('990', 18);
    await dai.connect(whale).transfer(LP.address, LP_DEPOSIT_AMOUNT);
    await dai.connect(LP).approve(txsAddr, LP_DEPOSIT_AMOUNT);

    await txs.setStorageAddress(hex4Bytes('LP'), LP.address);
    await txs.setStorageUint256(hex4Bytes('LP_DEPOSIT_AMOUNT'), LP_DEPOSIT_AMOUNT);
    await txs.setStorageUint256(hex4Bytes('CLOSING_DATE'), NEXT_TWO_MONTH);

    await agreement.connect(LP).execute(txIds[1]);

    // Step 3
    console.log('Step 3');
    await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH]);
    const REMAINING = BigNumber.from(2).mul(LP_DEPOSIT_AMOUNT).div(98).sub(GP_DEPOSIT_AMOUNT);
    console.log({ REMAINING: REMAINING.toString() });
    await dai.connect(whale).transfer(GP.address, REMAINING);
    await dai.connect(GP).approve(txsAddr, REMAINING);

    await txs.setStorageUint256(hex4Bytes('CLOSING_DATE_MINUS_ONE_DAY'), NEXT_TWO_MONTH - ONE_DAY);
    await txs.setStorageUint256(hex4Bytes('CLOSING_DATE_PLUS_ONE_DAY'), NEXT_TWO_MONTH + ONE_DAY);
    await txs.setStorageUint256(hex4Bytes('REMAINING'), REMAINING);

    await agreement.connect(GP).execute(txIds[2]);

    // Step 4 (pre)
    console.log('Step 4');
    await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 2 * ONE_DAY]);
    await txs.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), NEXT_TWO_MONTH + 7 * ONE_DAY);

    await expect(() => agreement.connect(LP).execute(txIds[3])).to.changeTokenBalances(
      dai,
      [GP, LP],
      [GP_DEPOSIT_AMOUNT, LP_DEPOSIT_AMOUNT]
    );
  });
});
