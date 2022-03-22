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
  let LAST_BLOCK_TIMESTAMP: number;

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;

  // Add tx objects to Agreement
  const addSteps = async (steps: TxObject[], Ctx: Context__factory) => {
    let txCtx;

    for await (const step of steps) {
      txCtx = await Ctx.deploy();
      const cdCtxsAddrs = [];

      for (let i = 0; i < step.conditions.length; i++) {
        const cond = await Ctx.deploy();
        cdCtxsAddrs.push(cond.address);
        await agreement.parse(step.conditions[i], cond.address);
      }
      await agreement.parse(step.transaction, txCtx.address);

      await agreement.update(
        step.txId,
        step.requiredTxs,
        step.signatory,
        step.transaction,
        step.conditions,
        txCtx.address,
        cdCtxsAddrs
      );
    }
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

    const steps = [
      // Alice deposits 1 ETH to SC
      {
        txId: 1,
        requiredTxs: [],
        signatory: alice.address,
        transaction: `msgValue == uint256 ${oneEth}`,
        conditions: ['bool true'],
      },
      // Bob lends 10 tokens to Alice
      {
        txId: 2,
        requiredTxs: [1],
        signatory: bob.address,
        transaction: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
        conditions: ['bool true'],
      },
      // Alice returns 10 tokens to Bob and collects 1 ETH
      {
        txId: 3,
        requiredTxs: [2],
        signatory: alice.address,
        transaction: `
              (transferFrom TOKEN_ADDR ALICE BOB ${tenTokens.toString()})
          and (sendEth ALICE ${oneEth})
        `,
        conditions: ['bool true'],
      },
    ];

    // Add tx objects to Agreement
    console.log('before addSteps');
    await addSteps(steps, ContextCont);
    console.log('after addSteps');

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

    const steps = [
      // Alice deposits 1 ETH to SC
      {
        txId: 1,
        requiredTxs: [],
        signatory: alice.address,
        transaction: `msgValue == uint256 ${oneEth}`,
        conditions: ['bool true'],
      },
      // Carl deposits 10 tokens to Agreement
      {
        txId: 2,
        requiredTxs: [],
        signatory: carl.address,
        transaction: `transferFrom TOKEN_ADDR CARL TRANSACTIONS ${tenTokens.toString()}`,
        conditions: ['bool true'],
      },
      // Bob lends 10 tokens to Alice
      {
        txId: 3,
        requiredTxs: [1],
        signatory: bob.address,
        transaction: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
        conditions: ['bool true'],
      },
      // Alice returns 10 tokens to Bob and collects 1 ETH
      {
        txId: 4,
        requiredTxs: [3],
        signatory: alice.address,
        transaction: `
              (transferFrom TOKEN_ADDR ALICE BOB ${tenTokens.toString()})
          and (sendEth ALICE ${oneEth})
          and (setLocalBool OBLIGATIONS_SETTLED true)
        `,
        conditions: ['bool true'],
      },
      // If Alice didn't return 10 tokens to Bob before EXPIRY
      // then Bob can collect 10 tokens from Carl
      {
        txId: 5,
        requiredTxs: [],
        signatory: bob.address,
        transaction: `
              transfer TOKEN_ADDR BOB ${tenTokens.toString()}
          and (setLocalBool LENDER_WITHDRAW_INSURERS true)
        `,
        conditions: [
          `
              blockTimestamp > loadLocal uint256 EXPIRY
          and (loadLocal bool OBLIGATIONS_SETTLED == bool false)
        `,
        ],
      },
      // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
      {
        txId: 6,
        requiredTxs: [],
        signatory: carl.address,
        transaction: `transfer TOKEN_ADDR CARL ${tenTokens.toString()}`,
        conditions: [
          `
              blockTimestamp > loadLocal uint256 EXPIRY
          and (loadLocal bool LENDER_WITHDRAW_INSURERS == bool false)
        `,
        ],
      },
    ];

    // Add tx objects to Agreement
    await addSteps(steps, ContextCont);

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

  it.only('Business case', async () => {
    const dai = await (await ethers.getContractFactory('Token'))
      .connect(whale)
      .deploy(parseUnits('1000000', 18));

    // TODO: check is possible to over/underflow in DSL with Math operations
    // TODO: global variables storage through DSL - should be already possible
    // TODO: ? global stack for Agreement ?
    // clarification about ETH/DAI swaps

    // TODO: 1. make `condition` an array of conditions
    // TODO: 2. make all variable calculations inside DSL
    // TODO: 3. fix remaining funds on Agreement issue
    const steps = [
      {
        txId: 1,
        requiredTxs: [],
        signatory: GP.address,
        transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_INITIAL',
        conditions: [
          `
              (blockTimestamp < loadLocal uint256 PLACEMENT_DATE)
          and (
            loadLocal uint256 GP_INITIAL >=
            loadLocal uint256 ((INITIAL_FUNDS_TARGET * uint256 2) / uint256 100)
          )`,
        ],
      },
      // Note: for now we're assuming that we have only one LP
      {
        txId: 2,
        requiredTxs: [1],
        signatory: LP.address,
        transaction: `
          transferFromVar DAI LP TRANSACTIONS_CONT LP_INITIAL
        `,
        conditions: [
          `
          (blockTimestamp >= loadLocal uint256 PLACEMENT_DATE)
          and
          (blockTimestamp < loadLocal uint256 CLOSING_DATE)
        `,
        ],
      },
      {
        txId: 3,
        requiredTxs: [2],
        signatory: GP.address,
        transaction: `
          transferFromVar DAI GP TRANSACTIONS_CONT GP_REMAINING
        `,
        conditions: [
          `(
            uint256 2 * loadLocal uint256 LP_INITIAL / uint256 98 - loadLocal uint256 GP_INITIAL
           ) setUint256 GP_REMAINING`,
          `(blockTimestamp >= loadLocal uint256 LOW_LIM)
             and
           (blockTimestamp <= loadLocal uint256 UP_LIM)
             and
           (balanceOf DAI TRANSACTIONS_CONT >=
             ((loadLocal uint256 INITIAL_FUNDS_TARGET * uint256 98) / uint256 100)
           )`,
        ],
      },
      {
        txId: 4,
        requiredTxs: [2],
        signatory: LP.address, // TODO: make available for everyone?
        transaction: `
              (transferVar DAI GP GP_INITIAL)
              and
              (transferVar DAI LP LP_INITIAL)`,
        /**
         * Note: 9805 and 200 are 98.05 and 2.00 numbers respectively. The condition should be true
         * if LP / GP > 98 / 2. But due to integer division precision errors we add just a little
         * more to 98 (make it 98.05) to eliminate division errors.
         */
        conditions: [
          `
      (uint256 9805 * (loadLocal uint256 GP_REMAIN + loadLocal uint256 GP_INITIAL)
        <
        uint256 200 * loadLocal uint256 LP_INITIAL)
      and (blockTimestamp > loadLocal uint256 UP_LIM)
      and (blockTimestamp < loadLocal uint256 FID)`,
        ],
      },
      {
        // Note: here we don't return ETH to the contract but just withdraw DAI and then return the
        //       same amount of DAI
        txId: 5,
        requiredTxs: [3],
        signatory: GP.address,
        transaction: 'transferVar DAI GP PURCHASE_AMOUNT',
        conditions: [
          `(blockTimestamp >= loadLocal uint256 FID)
              and
           (uint256 10 * loadLocal uint256 PURCHASE_AMOUNT
              <= uint256 9 * (balanceOf DAI TRANSACTIONS_CONT))
            `,
        ],
      },
      {
        // Note: as we've skipped transferring ETH in the previous step (step 5) then by
        //       transferring some additional DAI to the contract is equal to swapping ETH that
        //       should be on the contract to DAI. So at the end of the day the result is still the
        //       same: there is more DAI on the contract that it were initially deposited by GP & LP
        txId: 6,
        requiredTxs: [],
        signatory: GP.address, // TODO: make `anyone`
        // TODO: swap ETH for DAI
        transaction: 'transferFromVar DAI WHALE TRANSACTIONS_CONT SOME_DAI',
        conditions: ['blockTimestamp >= loadLocal uint256 FID + loadLocal uint256 ONE_YEAR'],
      },
      {
        txId: 71,
        requiredTxs: [6],
        signatory: GP.address,
        transaction: 'transferVar DAI GP MANAGEMENT_FEE',
        conditions: [
          '(loadLocal uint256 LP_INITIAL * uint256 2 / uint256 100) setUint256 MANAGEMENT_FEE',
          `
              (uint256 100 * loadLocal uint256 MANAGEMENT_FEE
                <= uint256 2 * loadLocal uint256 LP_INITIAL)
            `,
        ],
      },
      {
        txId: 72,
        requiredTxs: [6],
        signatory: GP.address,
        transaction: 'transferVar DAI GP CARRY',
        conditions: [
          `(
            balanceOf DAI TRANSACTIONS_CONT -
              loadLocal uint256 GP_INITIAL -
              loadLocal uint256 LP_INITIAL -
              loadLocal uint256 GP_REMAINING
            ) setUint256 PROFIT`,
          `(
            loadLocal uint256 LP_INITIAL *
              loadLocal uint256 HURDLE /
              uint256 100
            ) setUint256 THRESHOLD`,
          '(loadLocal uint256 PROFIT - loadLocal uint256 THRESHOLD) setUint256 DELTA',
          '(loadLocal uint256 DELTA * uint256 20 / uint256 100) setUint256 CARRY',
        ],
      },
      {
        txId: 73,
        requiredTxs: [6],
        signatory: GP.address,
        transaction: 'transferVar DAI GP GP_TO_WITHDRAW',
        conditions: [
          `
          (loadLocal uint256 PROFIT > uint256 0)
          ifelse ZERO_LOSS NON_ZERO_LOSS
          end

          ZERO_LOSS {
            (uint256 0) setUint256 LOSS
          }

          NON_ZERO_LOSS {
            (loadLocal uint256 GP_INITIAL +
              loadLocal uint256 LP_INITIAL +
              loadLocal uint256 GP_REMAINING -
              (balanceOf DAI TRANSACTIONS_CONT)
            ) setUint256 LOSS
          }
          `,
          `(loadLocal uint256 GP_INITIAL +
              loadLocal uint256 GP_REMAINING -
              loadLocal uint256 LOSS
            ) setUint256 GP_TO_WITHDRAW`,
        ],
      },
      {
        txId: 8,
        requiredTxs: [6],
        signatory: LP.address,
        transaction: 'transferVar DAI LP LP_TO_WITHDRAW',
        conditions: [
          '(loadLocal uint256 PROFIT - loadLocal uint256 CARRY) setUint256 LP_PROFIT',
          `(
            (loadLocal uint256 GP_INITIAL - loadLocal uint256  GP_REMAINING) >
            loadLocal uint256 LOSS
          )
          ifelse ZERO NON_ZERO
          end

          ZERO {
            (uint256 0) setUint256 UNCOVERED_NET_LOSSES
          }

          NON_ZERO {
            (loadLocal uint256 LOSS -
              loadLocal uint256 GP_INITIAL -
              loadLocal uint256 GP_REMAINING
            ) setUint256 UNCOVERED_NET_LOSSES
          }
          `,
          `(loadLocal uint256 LP_INITIAL +
              loadLocal uint256 LP_PROFIT -
              loadLocal uint256 MANAGEMENT_FEE -
              loadLocal uint256 UNCOVERED_NET_LOSSES
            ) setUint256 LP_TO_WITHDRAW`,
        ],
      },
    ];

    // Add tx objects to Agreement
    console.log('Adding logical steps into agreement...');
    await addSteps(steps, ContextCont);
    console.log('Done!');

    LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
    NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

    // Step 1
    console.log('Step 1');
    const GP_INITIAL = parseUnits('20', 18);
    await dai.connect(whale).transfer(GP.address, GP_INITIAL);
    await dai.connect(GP).approve(txsAddr, GP_INITIAL);

    await txs.setStorageAddress(hex4Bytes('DAI'), dai.address);
    await txs.setStorageAddress(hex4Bytes('GP'), GP.address);
    await txs.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), txsAddr);
    await txs.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), parseUnits('1000', 18));
    await txs.setStorageUint256(hex4Bytes('GP_INITIAL'), GP_INITIAL);
    await txs.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), NEXT_MONTH);

    await agreement.connect(GP).execute(1);
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 2
    console.log('Step 2');
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    const LP_INITIAL = parseUnits('990', 18);
    await dai.connect(whale).transfer(LP.address, LP_INITIAL);
    await dai.connect(LP).approve(txsAddr, LP_INITIAL);

    await txs.setStorageAddress(hex4Bytes('LP'), LP.address);
    await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
    await txs.setStorageUint256(hex4Bytes('CLOSING_DATE'), NEXT_TWO_MONTH);

    await agreement.connect(LP).execute(2);
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 3
    console.log('Step 3');
    // Note: we give GP 2 days time to obtain a 98% / 2% ratio of LP / GP deposits
    await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH]);
    const GP_REMAINING = BigNumber.from(2).mul(LP_INITIAL).div(98).sub(GP_INITIAL);
    await dai.connect(whale).transfer(GP.address, GP_REMAINING);
    await dai.connect(GP).approve(txsAddr, GP_REMAINING);

    await txs.setStorageUint256(hex4Bytes('LOW_LIM'), NEXT_TWO_MONTH - ONE_DAY);
    await txs.setStorageUint256(hex4Bytes('UP_LIM'), NEXT_TWO_MONTH + ONE_DAY);

    await agreement.connect(GP).execute(3);
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 4
    // console.log('Step 4');
    // await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 2 * ONE_DAY]);
    // // fund investment date
    // await txs.setStorageUint256(hex4Bytes('FID'), NEXT_TWO_MONTH + 7 * ONE_DAY);

    // await expect(() => agreement.connect(LP).execute(4)).to.changeTokenBalances(
    //   dai,
    //   [GP, LP],
    //   [GP_INITIAL, LP_INITIAL]
    // );

    // Step 5
    console.log('Step 5');
    let DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
    const PURCHASE_AMOUNT = DAI_BAL_OF_TXS.mul(9).div(10);
    console.log({ PURCHASE_AMOUNT: PURCHASE_AMOUNT.toString() });
    const FID = NEXT_TWO_MONTH + 7 * ONE_DAY; // FID = Fund Investment Date

    await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 7 * ONE_DAY]);
    await txs.setStorageUint256(hex4Bytes('FID'), FID);
    await txs.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT);

    await expect(() => agreement.connect(GP).execute(5)).to.changeTokenBalance(
      dai,
      GP,
      PURCHASE_AMOUNT
    );
    await dai.connect(GP).transfer(txsAddr, PURCHASE_AMOUNT);
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 6
    console.log('Step 6');
    const ONE_YEAR = 365 * ONE_DAY;
    const WHALE = whale.address;
    const SOME_DAI = parseUnits('200', 18);

    await ethers.provider.send('evm_setNextBlockTimestamp', [FID + ONE_YEAR]);

    await txs.setStorageUint256(hex4Bytes('WHALE'), WHALE);
    await txs.setStorageUint256(hex4Bytes('SOME_DAI'), SOME_DAI);
    await dai.connect(whale).approve(txsAddr, SOME_DAI);

    await agreement.connect(GP).execute(6);
    expect(await dai.balanceOf(txsAddr)).to.equal(
      GP_INITIAL.add(LP_INITIAL).add(GP_REMAINING).add(SOME_DAI)
    );
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 7a
    console.log('Step 7a');
    const MANAGEMENT_FEE = LP_INITIAL.mul(2).div(100);

    await expect(() => agreement.connect(GP).execute(71)).to.changeTokenBalance(
      dai,
      GP,
      MANAGEMENT_FEE
    );
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 7b
    console.log('Step 7b');
    DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
    const PROFIT = DAI_BAL_OF_TXS.sub(GP_INITIAL).sub(LP_INITIAL).sub(GP_REMAINING);
    console.log({ PROFIT: PROFIT.toString() });
    const HURDLE = 9; // 9%
    const THRESHOLD = LP_INITIAL.mul(HURDLE).div(100);
    const DELTA = PROFIT.sub(THRESHOLD);
    const CARRY = DELTA.mul(20).div(100); // DELTA * 20%
    console.log({ CARRY: CARRY.toString() });

    await txs.setStorageUint256(hex4Bytes('HURDLE'), HURDLE);

    await expect(() => agreement.connect(GP).execute(72)).to.changeTokenBalance(dai, GP, CARRY);
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 7c
    console.log('Step 7c');
    DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
    const LOSS = PROFIT.gt(0)
      ? BigNumber.from(0)
      : GP_INITIAL.add(LP_INITIAL).add(GP_REMAINING).sub(DAI_BAL_OF_TXS);
    // TODO: make sure if LOSS > (GP_INITIAL + GP_REMAINING) then there will be no error and
    //       GP_TO_WITHDRAW will be set to 0
    const GP_TO_WITHDRAW = GP_INITIAL.add(GP_REMAINING).sub(LOSS);
    console.log({ GP_TO_WITHDRAW: GP_TO_WITHDRAW.toString() });

    await expect(() => agreement.connect(GP).execute(73)).to.changeTokenBalance(
      dai,
      GP,
      GP_TO_WITHDRAW
    );
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });

    // Step 8
    console.log('Step 8');
    const LP_PROFIT = PROFIT.sub(CARRY);
    console.log({ LP_PROFIT: LP_PROFIT.toString() });

    const UNCOVERED_NET_LOSSES = GP_INITIAL.sub(GP_REMAINING).gte(LOSS)
      ? 0
      : LOSS.sub(GP_INITIAL).sub(GP_REMAINING);
    console.log({ UNCOVERED_NET_LOSSES: UNCOVERED_NET_LOSSES.toString() });
    const LP_TO_WITHDRAW = LP_INITIAL.add(LP_PROFIT).sub(MANAGEMENT_FEE).sub(UNCOVERED_NET_LOSSES);
    console.log({ LP_TO_WITHDRAW: LP_TO_WITHDRAW.toString() });

    await expect(() => agreement.connect(LP).execute(8)).to.changeTokenBalance(
      dai,
      LP,
      LP_TO_WITHDRAW
    );
    console.log({ DAI_BAL_OF_TXS: (await dai.balanceOf(txsAddr)).toString() });
    console.log({ remainingOnConract: (await dai.balanceOf(txsAddr)).toString() });
  });
});
