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
    transaction: `transferFrom TOKEN_ADDR CARL AGREEMENT ${tenTokens.toString()}`,
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
          and (setLocalBool OBLIGATIONS_SETTLED true)`,
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
    conditions: ['time > var EXPIRY and (var OBLIGATIONS_SETTLED == bool false)'],
  },
  // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
  {
    txId: '36',
    requiredTxs: [],
    signatories: [carl.address],
    transaction: `transfer TOKEN_ADDR CARL ${tenTokens.toString()}`,
    conditions: ['time > var EXPIRY and (var LENDER_WITHDRAW_INSURERS == bool false)'],
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
    transaction: 'transferFromVar DAI GP AGREEMENT GP_INITIAL',
    conditions: [
      `(time < var PLACEMENT_DATE)
       and (
         var GP_INITIAL >=
        ((var INITIAL_FUNDS_TARGET * var DEPOSIT_MIN_PERCENT) / 100)
       )`,
    ],
  },
  {
    txId: index.concat('2'),
    requiredTxs: [index.concat('1')],
    signatories: LPsAddrs,
    transaction: `(transferFromVar DAI LP AGREEMENT LP_INITIAL)
          and
        (var LP_TOTAL + var LP_INITIAL) setUint256 LP_TOTAL`,
    conditions: ['time >= var PLACEMENT_DATE', 'time < var CLOSING_DATE'],
  },
  {
    txId: index.concat('3'),
    requiredTxs: [index.concat('2')],
    signatories: [GPAddr],
    transaction: 'transferFromVar DAI GP AGREEMENT GP_REMAINING',
    conditions: [
      'var GP_INITIAL + var LP_TOTAL >= var INITIAL_FUNDS_TARGET',
      '(var DEPOSIT_MIN_PERCENT * var LP_TOTAL / var P1) setUint256 TWO_PERCENT',
      `
      (var TWO_PERCENT > var GP_INITIAL)
      ifelse POS NEG
      end
      POS {
        (var TWO_PERCENT - var GP_INITIAL
        ) setUint256 GP_REMAINING
      }
      NEG {
        0 setUint256 GP_REMAINING
      }`,
      'time >= var LOW_LIM',
      'time <= var UP_LIM',
      '(balanceOf DAI AGREEMENT) >= ((var INITIAL_FUNDS_TARGET * var P1) / 100)',
    ],
  },
  {
    txId: index.concat('4'),
    requiredTxs: [index.concat('2')],
    signatories: LPsAddrs,
    transaction: '(transferVar DAI GP GP_INITIAL) and (transferVar DAI LP LP_INITIAL)',
    /**
     * Note: 9805 and 200 are 98.05 and 2.00 numbers respectively. The condition should be true
     * if LP / GP > 98 / 2. But due to integer division precision errors we add just a little
     * more to 98 (make it 98.05) to eliminate division errors.
     */
    conditions: [
      `((100 * var P1) + 5) * (var GP_REMAINING + var GP_INITIAL)
         <
        (100 * var P2) * var LP_INITIAL`,
      'time > var UP_LIM',
      'time < var FUND_INVESTMENT_DATE',
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
      `(time >= var FUND_INVESTMENT_DATE)
         and
       (100 * var PURCHASE_AMOUNT <= var PURCHASE_PERCENT * (balanceOf DAI AGREEMENT))`,
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
    transaction: 'transferFromVar DAI WHALE AGREEMENT GP_PURCHASE_RETURN',
    conditions: ['time >= var FUND_INVESTMENT_DATE + var ONE_YEAR'],
  },
  {
    txId: index.concat('71'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP MANAGEMENT_FEE',
    conditions: [
      '(var LP_TOTAL * var MANAGEMENT_PERCENT / 100) setUint256 MANAGEMENT_FEE',
      '(100 * var MANAGEMENT_FEE <= var MANAGEMENT_PERCENT * var LP_TOTAL)',
    ],
  },
  {
    txId: index.concat('72'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP CARRY',
    conditions: [
      '(var GP_INITIAL + var LP_TOTAL + var GP_REMAINING) setUint256 INITIAL_DEPOSIT',
      `(balanceOf DAI AGREEMENT > (var INITIAL_DEPOSIT - var MANAGEMENT_FEE))
        ifelse HAS_PROFIT NO_PROFIT
        end

        HAS_PROFIT {
          (balanceOf DAI AGREEMENT +
            var MANAGEMENT_FEE -
            var INITIAL_DEPOSIT
          ) setUint256 PROFIT
        }

        NO_PROFIT {
          0 setUint256 PROFIT
        }
      `,
      '(var LP_TOTAL * var HURDLE / 100) setUint256 THRESHOLD',
      `(var PROFIT > var THRESHOLD)
        ifelse NONZERO_DELTA ZERO_DELTA
        end

        NONZERO_DELTA {
          (var PROFIT - var THRESHOLD) setUint256 DELTA
        }

        ZERO_DELTA {
          0 setUint256 DELTA
        }`,
      '(var DELTA * var PROFIT_PART / 100) setUint256 CARRY',
    ],
  },
  {
    txId: index.concat('73'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP GP_PRINICIPAL',
    conditions: [
      `
      (var PROFIT > 0)
      ifelse ZERO_LOSS NONZERO_LOSS
      end

      ZERO_LOSS {
        0 setUint256 LOSS
      }

      NONZERO_LOSS {
        (var GP_INITIAL +
          var LP_TOTAL +
          var GP_REMAINING -
          (balanceOf DAI AGREEMENT) -
          var MANAGEMENT_FEE
        ) setUint256 LOSS
      }`,
      `
      (var LOSS > (var GP_INITIAL + var GP_REMAINING))
      ifelse WITHDRAW_ZERO WITHDRAW_NONZERO
      end

      WITHDRAW_ZERO {
        0 setUint256 GP_PRINICIPAL
      }

      WITHDRAW_NONZERO {
        (var GP_INITIAL +
          var GP_REMAINING -
          var LOSS
        ) setUint256 GP_PRINICIPAL
      }`,
    ],
  },
  {
    txId: index.concat('81'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PROFIT',
    conditions: [
      '(var PROFIT - var CARRY) setUint256 ALL_LPS_PROFIT',
      '(var ALL_LPS_PROFIT * var LP_INITIAL / var LP_TOTAL) setUint256 LP_PROFIT',
    ],
  },
  {
    txId: index.concat('82'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PRINCIPAL',
    conditions: [
      '(var MANAGEMENT_FEE * var LP_INITIAL / var LP_TOTAL) setUint256 MANAGEMENT_FEE_LP',
      `((var GP_INITIAL + var GP_REMAINING) > var LOSS)
        ifelse ZERO NONZERO
        end

        ZERO {
          0 setUint256 UNCOVERED_NET_LOSSES
        }

        NONZERO {
          (var LOSS -
            var GP_INITIAL -
            var GP_REMAINING
          ) setUint256 UNCOVERED_NET_LOSSES
        }`,
      '(var LP_INITIAL - var MANAGEMENT_FEE_LP - var UNCOVERED_NET_LOSSES) setUint256 LP_PRINCIPAL',
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
    transaction: 'transferFromVar DAI GP AGREEMENT GP_INITIAL',
    conditions: [
      `(time < PLACEMENT_DATE)
       and (GP_INITIAL >= ((INITIAL_FUNDS_TARGET * DEPOSIT_MIN_PERCENT) / 100))`,
    ],
  },
  {
    txId: index.concat('2'),
    requiredTxs: [index.concat('1')],
    signatories: LPsAddrs,
    transaction: `(transferFromVar DAI LP AGREEMENT LP_INITIAL)
      and (LP_TOTAL + LP_INITIAL) setUint256 LP_TOTAL`,
    conditions: ['time >= PLACEMENT_DATE', 'time < CLOSING_DATE'],
  },
  {
    txId: index.concat('3'),
    requiredTxs: [index.concat('2')],
    signatories: [GPAddr],
    transaction: 'transferFromVar DAI GP AGREEMENT GP_REMAINING',
    conditions: [
      'GP_INITIAL + LP_TOTAL >= INITIAL_FUNDS_TARGET',
      '(DEPOSIT_MIN_PERCENT * LP_TOTAL / P1) setUint256 TWO_PERCENT',
      `(TWO_PERCENT > GP_INITIAL)
      ifelse POS NEG
      end

      POS {
        (TWO_PERCENT - GP_INITIAL) setUint256 GP_REMAINING
      }

      NEG {
        0 setUint256 GP_REMAINING
      }`,
      'time >= LOW_LIM',
      'time <= UP_LIM',
      '(balanceOf DAI AGREEMENT) >= ((INITIAL_FUNDS_TARGET * P1) / 100)',
    ],
  },
  {
    txId: index.concat('4'),
    requiredTxs: [index.concat('2')],
    signatories: LPsAddrs,
    transaction: `
      (transferVar DAI GP GP_INITIAL) and (transferVar DAI LP LP_INITIAL)`,
    /**
     * Note: 9805 and 200 are 98.05 and 2.00 numbers respectively. The condition should be true
     * if LP / GP > 98 / 2. But due to integer division precision errors we add just a little
     * more to 98 (make it 98.05) to eliminate division errors.
     */
    conditions: [
      '((100 * P1) + 5) * (GP_REMAINING + GP_INITIAL) < (100 * P2) * LP_INITIAL',
      'time > UP_LIM',
      'time < FUND_INVESTMENT_DATE',
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
      `(time >= FUND_INVESTMENT_DATE)
         and
       (100 * PURCHASE_AMOUNT <= PURCHASE_PERCENT * (balanceOf DAI AGREEMENT))`,
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
    transaction: 'transferFromVar DAI WHALE AGREEMENT GP_PURCHASE_RETURN',
    conditions: ['time >= FUND_INVESTMENT_DATE + ONE_YEAR'],
  },
  {
    txId: index.concat('71'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP MANAGEMENT_FEE',
    conditions: [
      '(LP_TOTAL * MANAGEMENT_PERCENT / 100) setUint256 MANAGEMENT_FEE',
      '(100 * MANAGEMENT_FEE <= MANAGEMENT_PERCENT * LP_TOTAL)',
    ],
  },
  {
    txId: index.concat('72'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP CARRY',
    conditions: [
      '(GP_INITIAL + LP_TOTAL + GP_REMAINING) setUint256 INITIAL_DEPOSIT',
      `(balanceOf DAI AGREEMENT > (INITIAL_DEPOSIT - MANAGEMENT_FEE))
        ifelse HAS_PROFIT NO_PROFIT
        end

        HAS_PROFIT {
          (balanceOf DAI AGREEMENT + MANAGEMENT_FEE - INITIAL_DEPOSIT) setUint256 PROFIT
        }

        NO_PROFIT {
          0 setUint256 PROFIT
        }
      `,
      '(LP_TOTAL * HURDLE / 100) setUint256 THRESHOLD',
      `(PROFIT > THRESHOLD)
        ifelse NONZERO_DELTA ZERO_DELTA
        end

        NONZERO_DELTA {
          (PROFIT - THRESHOLD) setUint256 DELTA
        }

        ZERO_DELTA {
          0 setUint256 DELTA
        }`,
      '(DELTA * PROFIT_PART / 100) setUint256 CARRY',
    ],
  },
  {
    txId: index.concat('73'),
    requiredTxs: [index.concat('6')],
    signatories: [GPAddr],
    transaction: 'transferVar DAI GP GP_PRINICIPAL',
    conditions: [
      `
      (PROFIT > 0)
      ifelse ZERO_LOSS NONZERO_LOSS
      end

      ZERO_LOSS {
        0 setUint256 LOSS
      }

      NONZERO_LOSS {
        (GP_INITIAL + LP_TOTAL + GP_REMAINING -
          (balanceOf DAI AGREEMENT) - MANAGEMENT_FEE
        ) setUint256 LOSS
      }
      `,
      `
      (LOSS > (GP_INITIAL + GP_REMAINING))
      ifelse WITHDRAW_ZERO WITHDRAW_NONZERO
      end

      WITHDRAW_ZERO {
        0 setUint256 GP_PRINICIPAL
      }

      WITHDRAW_NONZERO {
        (GP_INITIAL + GP_REMAINING - LOSS) setUint256 GP_PRINICIPAL
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
      '(PROFIT - CARRY) setUint256 ALL_LPS_PROFIT',
      '(ALL_LPS_PROFIT * LP_INITIAL / LP_TOTAL) setUint256 LP_PROFIT',
    ],
  },
  {
    txId: index.concat('82'),
    requiredTxs: [index.concat('6')],
    signatories: LPsAddrs,
    transaction: 'transferVar DAI LP LP_PRINCIPAL',
    conditions: [
      '(MANAGEMENT_FEE * LP_INITIAL / LP_TOTAL) setUint256 MANAGEMENT_FEE_LP',
      `((GP_INITIAL + GP_REMAINING) > LOSS)
        ifelse ZERO NONZERO
        end

        ZERO {
          0 setUint256 UNCOVERED_NET_LOSSES
        }

        NONZERO {
          (LOSS - GP_INITIAL - GP_REMAINING) setUint256 UNCOVERED_NET_LOSSES
        }
      `,
      '(LP_INITIAL - MANAGEMENT_FEE_LP - UNCOVERED_NET_LOSSES) setUint256 LP_PRINCIPAL',
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
      `(time >= var FUND_INVESTMENT_DATE) and
       (100 * var PURCHASE_AMOUNT <= var PURCHASE_PERCENT * (balanceOf DAI AGREEMENT))`,
    ],
  },
];
