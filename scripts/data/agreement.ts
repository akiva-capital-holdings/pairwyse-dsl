import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { TxObject } from '../../test/types';

export const oneEthToBobSteps = (alice: SignerWithAddress) => [
  {
    txId: 1,
    requiredTxs: [],
    signatories: [alice.address],
    conditions: ['bool true'],
    transaction: 'msgValue == 1e18',
  },
  {
    txId: 2,
    requiredTxs: [1],
    signatories: [alice.address],
    conditions: ['bool true'],
    transaction: 'sendEth BOB 1e18',
  },
];

export const aliceAndBobSteps = (
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  oneEth: BigNumber,
  tenTokens: BigNumber
) => [
  // Alice deposits 1 ETH to SC
  {
    txId: '21',
    requiredTxs: [],
    signatories: [alice.address],
    transaction: `msgValue == ${oneEth}`,
    conditions: ['bool true'],
  },
  // Bob lends 10 tokens to Alice
  {
    txId: '22',
    requiredTxs: ['21'],
    signatories: [bob.address],
    transaction: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
    conditions: ['bool true'],
  },
  // Alice returns 10 tokens to Bob and collects 1 ETH
  {
    txId: '23',
    requiredTxs: ['22'],
    signatories: [alice.address],
    transaction: `
              (transferFrom TOKEN_ADDR ALICE BOB ${tenTokens.toString()})
          and (sendEth ALICE ${oneEth})
        `,
    conditions: ['bool true'],
  },
];

export const aliceBobAndCarl = (
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  carl: SignerWithAddress,
  oneEth: BigNumber,
  tenTokens: BigNumber
) => [
  // Alice deposits 1 ETH to SC
  {
    txId: '31',
    requiredTxs: [],
    signatories: [alice.address],
    transaction: `msgValue == ${oneEth}`,
    conditions: ['bool true'],
  },
  // Carl deposits 10 tokens to Agreement
  {
    txId: '32',
    requiredTxs: [],
    signatories: [carl.address],
    transaction: `transferFrom TOKEN_ADDR CARL TRANSACTIONS ${tenTokens.toString()}`,
    conditions: ['bool true'],
  },
  // Bob lends 10 tokens to Alice
  {
    txId: '33',
    requiredTxs: ['31'],
    signatories: [bob.address],
    transaction: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
    conditions: ['bool true'],
  },
  // Alice returns 10 tokens to Bob and collects 1 ETH
  {
    txId: '34',
    requiredTxs: ['33'],
    signatories: [alice.address],
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
    txId: '35',
    requiredTxs: [],
    signatories: [bob.address],
    transaction: `
              transfer TOKEN_ADDR BOB ${tenTokens.toString()}
          and (setLocalBool LENDER_WITHDRAW_INSURERS true)
        `,
    conditions: [
      `
              TIME > loadLocal uint256 EXPIRY
          and (loadLocal bool OBLIGATIONS_SETTLED == bool false)
        `,
    ],
  },
  // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
  {
    txId: '36',
    requiredTxs: [],
    signatories: [carl.address],
    transaction: `transfer TOKEN_ADDR CARL ${tenTokens.toString()}`,
    conditions: [
      `
              TIME > loadLocal uint256 EXPIRY
          and (loadLocal bool LENDER_WITHDRAW_INSURERS == bool false)
        `,
    ],
  },
];

export const businessCaseSteps = (
  GPAddr: string,
  LPsAddrs: string[],
  index: string
): TxObject[] => [
  {
    txId: index.concat('1'),
    requiredTxs: [],
    signatories: [GPAddr],
    transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_INITIAL',
    conditions: [
      `(TIME < loadLocal uint256 PLACEMENT_DATE)
       and (
         loadLocal uint256 GP_INITIAL >=
        ((loadLocal uint256 INITIAL_FUNDS_TARGET * loadLocal uint256 DEPOSIT_MIN_PERCENT) / 100)
       )`,
    ],
  },
  {
    txId: index.concat('2'),
    requiredTxs: [index.concat('1')],
    signatories: LPsAddrs,
    transaction: `(transferFromVar DAI LP TRANSACTIONS_CONT LP_INITIAL)
          and
        (loadLocal uint256 LP_TOTAL + loadLocal uint256 LP_INITIAL) setUint256 LP_TOTAL`,
    conditions: [
      'TIME >= loadLocal uint256 PLACEMENT_DATE',
      'TIME < loadLocal uint256 CLOSING_DATE',
    ],
  },
  {
    txId: index.concat('3'),
    requiredTxs: [index.concat('2')],
    signatories: [GPAddr],
    transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_REMAINING',
    conditions: [
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
  },
  {
    txId: index.concat('4'),
    requiredTxs: [index.concat('2')],
    signatories: LPsAddrs,
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
      `((100 * loadLocal uint256 P1) + 5) * (loadLocal uint256 GP_REMAINING
          + loadLocal uint256 GP_INITIAL)
         <
       (100 * loadLocal uint256 P2) * loadLocal uint256 LP_INITIAL`,
      'TIME > loadLocal uint256 UP_LIM',
      'TIME < loadLocal uint256 FUND_INVESTMENT_DATE',
    ],
  },
  {
    // Note: here we don't return ETH to the contract but just withdraw DAI and then return the
    //       same amount of DAI
    txId: index.concat('5'),
    requiredTxs: [index.concat('3')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP PURCHASE_AMOUNT',
    conditions: [
      `(TIME >= loadLocal uint256 FUND_INVESTMENT_DATE)
         and
       (100 * loadLocal uint256 PURCHASE_AMOUNT
         <= loadLocal uint256 PURCHASE_PERCENT * (balanceOf DAI TRANSACTIONS_CONT))`,
    ],
  },
  {
    // Note: as we've skipped transferring ETH in the previous step (step 5) then by
    //       transferring some additional DAI to the contract is equal to swapping ETH that
    //       should be on the contract to DAI. So at the end of the day the result is still the
    //       same: there is more DAI on the contract that it were initially deposited by GP & LP
    txId: index.concat('6'),
    requiredTxs: [],
    signatories: [GPAddr],
    // TODO: swap ETH for DAI
    transaction: 'transferFromVar DAI WHALE TRANSACTIONS_CONT GP_PURCHASE_RETURN',
    conditions: ['TIME >= loadLocal uint256 FUND_INVESTMENT_DATE + loadLocal uint256 ONE_YEAR'],
  },
  {
    txId: index.concat('71'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP MANAGEMENT_FEE',
    conditions: [
      `(loadLocal uint256 LP_TOTAL * loadLocal uint256 MANAGEMENT_PERCENT / 100)
        setUint256 MANAGEMENT_FEE`,
      `(100 * loadLocal uint256 MANAGEMENT_FEE
         <= loadLocal uint256 MANAGEMENT_PERCENT * loadLocal uint256 LP_TOTAL)`,
    ],
  },
  {
    txId: index.concat('72'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP CARRY',
    conditions: [
      `(loadLocal uint256 GP_INITIAL +
          loadLocal uint256 LP_TOTAL +
          loadLocal uint256 GP_REMAINING
        ) setUint256 INITIAL_DEPOSIT`,
      `(balanceOf DAI TRANSACTIONS_CONT > (
          loadLocal uint256 INITIAL_DEPOSIT - loadLocal uint256 MANAGEMENT_FEE))
        ifelse HAS_PROFIT NO_PROFIT
        end

        HAS_PROFIT {
          (balanceOf DAI TRANSACTIONS_CONT +
            loadLocal uint256 MANAGEMENT_FEE -
            loadLocal uint256 INITIAL_DEPOSIT
          ) setUint256 PROFIT
        }

        NO_PROFIT {
          0 setUint256 PROFIT
        }
      `,
      '(loadLocal uint256 LP_TOTAL * loadLocal uint256 HURDLE / 100) setUint256 THRESHOLD',
      `(loadLocal uint256 PROFIT > loadLocal uint256 THRESHOLD)
        ifelse NONZERO_DELTA ZERO_DELTA
        end

        NONZERO_DELTA {
          (loadLocal uint256 PROFIT - loadLocal uint256 THRESHOLD) setUint256 DELTA
        }

        ZERO_DELTA {
          0 setUint256 DELTA
        }`,
      '(loadLocal uint256 DELTA * loadLocal uint256 PROFIT_PART / 100) setUint256 CARRY',
    ],
  },
  {
    txId: index.concat('73'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP GP_PRINICIPAL',
    conditions: [
      `
            (loadLocal uint256 PROFIT > 0)
            ifelse ZERO_LOSS NONZERO_LOSS
            end
            ZERO_LOSS {
              0 setUint256 LOSS
            }
            NONZERO_LOSS {
              (loadLocal uint256 GP_INITIAL +
                loadLocal uint256 LP_TOTAL +
                loadLocal uint256 GP_REMAINING -
                (balanceOf DAI TRANSACTIONS_CONT) -
                loadLocal uint256 MANAGEMENT_FEE
              ) setUint256 LOSS
            }
        `,
      `
          (loadLocal uint256 LOSS > (loadLocal uint256 GP_INITIAL + loadLocal uint256 GP_REMAINING))
          ifelse WITHDRAW_ZERO WITHDRAW_NONZERO
          end
          WITHDRAW_ZERO {
            0 setUint256 GP_PRINICIPAL
          }
          WITHDRAW_NONZERO {
            (loadLocal uint256 GP_INITIAL +
              loadLocal uint256 GP_REMAINING -
              loadLocal uint256 LOSS
            ) setUint256 GP_PRINICIPAL
          }
        `,
    ],
  },
  {
    txId: index.concat('81'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PROFIT',
    conditions: [
      '(loadLocal uint256 PROFIT - loadLocal uint256 CARRY) setUint256 ALL_LPs_PROFIT',
      `(loadLocal uint256 ALL_LPs_PROFIT *
          loadLocal uint256 LP_INITIAL /
          loadLocal uint256 LP_TOTAL
         ) setUint256 LP_PROFIT`,
    ],
  },
  {
    txId: index.concat('82'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PRINCIPAL',
    conditions: [
      `(
           loadLocal uint256 MANAGEMENT_FEE *
           loadLocal uint256 LP_INITIAL /
           loadLocal uint256 LP_TOTAL
         ) setUint256 MANAGEMENT_FEE_LP`,
      `(
           (loadLocal uint256 GP_INITIAL + loadLocal uint256 GP_REMAINING) >
           loadLocal uint256 LOSS
         )
         ifelse ZERO NONZERO
         end
         ZERO {
           0 setUint256 UNCOVERED_NET_LOSSES
         }
         NONZERO {
           (loadLocal uint256 LOSS -
             loadLocal uint256 GP_INITIAL -
             loadLocal uint256 GP_REMAINING
           ) setUint256 UNCOVERED_NET_LOSSES
         }
        `,
      `(loadLocal uint256 LP_INITIAL -
           loadLocal uint256 MANAGEMENT_FEE_LP -
           loadLocal uint256 UNCOVERED_NET_LOSSES
         ) setUint256 LP_PRINCIPAL`,
    ],
  },
];

// TODO: add in-DSL comments directly to the code
export const businessCaseStepsSimplified = (
  GPAddr: string,
  LPsAddrs: string[],
  index: string
): TxObject[] => [
  {
    txId: index.concat('1'),
    requiredTxs: [],
    signatories: [GPAddr],
    transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_INITIAL',
    conditions: [
      `(TIME < loadLocal uint256 PLACEMENT_DATE)
       and (
         loadLocal uint256 GP_INITIAL >=
        ((loadLocal uint256 INITIAL_FUNDS_TARGET * loadLocal uint256 DEPOSIT_MIN_PERCENT) / 100)
       )`,
    ],
  },
  {
    txId: index.concat('2'),
    requiredTxs: [index.concat('1')],
    signatories: LPsAddrs,
    transaction: `(transferFromVar DAI LP TRANSACTIONS_CONT LP_INITIAL)
          and
        (loadLocal uint256 LP_TOTAL + loadLocal uint256 LP_INITIAL) setUint256 LP_TOTAL`,
    conditions: [
      'TIME >= loadLocal uint256 PLACEMENT_DATE',
      'TIME < loadLocal uint256 CLOSING_DATE',
    ],
  },
  {
    txId: index.concat('3'),
    requiredTxs: [index.concat('2')],
    signatories: [GPAddr],
    transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_REMAINING',
    conditions: [
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
  },
  {
    txId: index.concat('4'),
    requiredTxs: [index.concat('2')],
    signatories: LPsAddrs,
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
      `((100 * loadLocal uint256 P1) + 5) * (loadLocal uint256 GP_REMAINING
          + loadLocal uint256 GP_INITIAL)
         <
       (100 * loadLocal uint256 P2) * loadLocal uint256 LP_INITIAL`,
      'TIME > loadLocal uint256 UP_LIM',
      'TIME < loadLocal uint256 FUND_INVESTMENT_DATE',
    ],
  },
  {
    // Note: here we don't return ETH to the contract but just withdraw DAI and then return the
    //       same amount of DAI
    txId: index.concat('5'),
    requiredTxs: [index.concat('3')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP PURCHASE_AMOUNT',
    conditions: [
      `(TIME >= loadLocal uint256 FUND_INVESTMENT_DATE)
         and
       (100 * loadLocal uint256 PURCHASE_AMOUNT
         <= loadLocal uint256 PURCHASE_PERCENT * (balanceOf DAI TRANSACTIONS_CONT))`,
    ],
  },
  {
    // Note: as we've skipped transferring ETH in the previous step (step 5) then by
    //       transferring some additional DAI to the contract is equal to swapping ETH that
    //       should be on the contract to DAI. So at the end of the day the result is still the
    //       same: there is more DAI on the contract that it were initially deposited by GP & LP
    txId: index.concat('6'),
    requiredTxs: [],
    signatories: [GPAddr],
    // TODO: swap ETH for DAI
    transaction: 'transferFromVar DAI WHALE TRANSACTIONS_CONT GP_PURCHASE_RETURN',
    conditions: ['TIME >= loadLocal uint256 FUND_INVESTMENT_DATE + loadLocal uint256 ONE_YEAR'],
  },
  {
    txId: index.concat('71'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP MANAGEMENT_FEE',
    conditions: [
      `(loadLocal uint256 LP_TOTAL * loadLocal uint256 MANAGEMENT_PERCENT / 100)
        setUint256 MANAGEMENT_FEE`,
      `(100 * loadLocal uint256 MANAGEMENT_FEE
         <= loadLocal uint256 MANAGEMENT_PERCENT * loadLocal uint256 LP_TOTAL)`,
    ],
  },
  {
    txId: index.concat('72'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP CARRY',
    conditions: [
      `(loadLocal uint256 GP_INITIAL +
          loadLocal uint256 LP_TOTAL +
          loadLocal uint256 GP_REMAINING
        ) setUint256 INITIAL_DEPOSIT`,
      `(balanceOf DAI TRANSACTIONS_CONT > (
          loadLocal uint256 INITIAL_DEPOSIT - loadLocal uint256 MANAGEMENT_FEE))
        ifelse HAS_PROFIT NO_PROFIT
        end

        HAS_PROFIT {
          (balanceOf DAI TRANSACTIONS_CONT +
            loadLocal uint256 MANAGEMENT_FEE -
            loadLocal uint256 INITIAL_DEPOSIT
          ) setUint256 PROFIT
        }

        NO_PROFIT {
          0 setUint256 PROFIT
        }
      `,
      '(loadLocal uint256 LP_TOTAL * loadLocal uint256 HURDLE / 100) setUint256 THRESHOLD',
      `(loadLocal uint256 PROFIT > loadLocal uint256 THRESHOLD)
        ifelse NONZERO_DELTA ZERO_DELTA
        end

        NONZERO_DELTA {
          (loadLocal uint256 PROFIT - loadLocal uint256 THRESHOLD) setUint256 DELTA
        }

        ZERO_DELTA {
          0 setUint256 DELTA
        }`,
      '(loadLocal uint256 DELTA * loadLocal uint256 PROFIT_PART / 100) setUint256 CARRY',
    ],
  },
  {
    txId: index.concat('73'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP GP_PRINICIPAL',
    conditions: [
      `
            (loadLocal uint256 PROFIT > 0)
            ifelse ZERO_LOSS NONZERO_LOSS
            end
            ZERO_LOSS {
              0 setUint256 LOSS
            }
            NONZERO_LOSS {
              (loadLocal uint256 GP_INITIAL +
                loadLocal uint256 LP_TOTAL +
                loadLocal uint256 GP_REMAINING -
                (balanceOf DAI TRANSACTIONS_CONT) -
                loadLocal uint256 MANAGEMENT_FEE
              ) setUint256 LOSS
            }
        `,
      `
          (loadLocal uint256 LOSS > (loadLocal uint256 GP_INITIAL + loadLocal uint256 GP_REMAINING))
          ifelse WITHDRAW_ZERO WITHDRAW_NONZERO
          end
          WITHDRAW_ZERO {
            0 setUint256 GP_PRINICIPAL
          }
          WITHDRAW_NONZERO {
            (loadLocal uint256 GP_INITIAL +
              loadLocal uint256 GP_REMAINING -
              loadLocal uint256 LOSS
            ) setUint256 GP_PRINICIPAL
          }
        `,
    ],
  },
  {
    txId: index.concat('81'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PROFIT',
    conditions: [
      '(loadLocal uint256 PROFIT - loadLocal uint256 CARRY) setUint256 ALL_LPs_PROFIT',
      `(loadLocal uint256 ALL_LPs_PROFIT *
          loadLocal uint256 LP_INITIAL /
          loadLocal uint256 LP_TOTAL
         ) setUint256 LP_PROFIT`,
    ],
  },
  {
    txId: index.concat('82'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PRINCIPAL',
    conditions: [
      `(
           loadLocal uint256 MANAGEMENT_FEE *
           loadLocal uint256 LP_INITIAL /
           loadLocal uint256 LP_TOTAL
         ) setUint256 MANAGEMENT_FEE_LP`,
      `(
           (loadLocal uint256 GP_INITIAL + loadLocal uint256 GP_REMAINING) >
           loadLocal uint256 LOSS
         )
         ifelse ZERO NONZERO
         end
         ZERO {
           0 setUint256 UNCOVERED_NET_LOSSES
         }
         NONZERO {
           (loadLocal uint256 LOSS -
             loadLocal uint256 GP_INITIAL -
             loadLocal uint256 GP_REMAINING
           ) setUint256 UNCOVERED_NET_LOSSES
         }
        `,
      `(loadLocal uint256 LP_INITIAL -
           loadLocal uint256 MANAGEMENT_FEE_LP -
           loadLocal uint256 UNCOVERED_NET_LOSSES
         ) setUint256 LP_PRINCIPAL`,
    ],
  },
];

export const aliceAndAnybodySteps = (OtherSigners: string[], index: string) => [
  // `anyone` as signatory can execute withdraw DAI and then return the
  // same amount of DAI in Agreement conditional tx
  {
    txId: index.concat('1'),
    requiredTxs: [],
    signatories: OtherSigners,
    transaction: 'transferVar DAI GP PURCHASE_AMOUNT',
    conditions: [
      `(TIME >= loadLocal uint256 FUND_INVESTMENT_DATE)
             and
       (100 * loadLocal uint256 PURCHASE_AMOUNT
        <= loadLocal uint256 PURCHASE_PERCENT * (balanceOf DAI TRANSACTIONS_CONT))`,
    ],
  },
];
