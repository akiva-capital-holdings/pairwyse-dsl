import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export const businessCaseSteps = (GP: SignerWithAddress, LP: SignerWithAddress) => [
  {
    txId: 1,
    requiredTxs: [],
    signatory: GP.address,
    transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_INITIAL',
    conditions: [
      `(blockTimestamp < loadLocal uint256 PLACEMENT_DATE)
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
    transaction: 'transferFromVar DAI LP TRANSACTIONS_CONT LP_INITIAL',
    conditions: [
      `(blockTimestamp >= loadLocal uint256 PLACEMENT_DATE)
         and
       (blockTimestamp < loadLocal uint256 CLOSING_DATE)`,
    ],
  },
  {
    txId: 3,
    requiredTxs: [2],
    signatory: GP.address,
    transaction: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_REMAINING',
    conditions: [
      `(uint256 2 * loadLocal uint256 LP_INITIAL / uint256 98 - loadLocal uint256 GP_INITIAL
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
      (uint256 9805 * (loadLocal uint256 GP_REMAINING + loadLocal uint256 GP_INITIAL)
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
         <= uint256 9 * (balanceOf DAI TRANSACTIONS_CONT))`,
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
      `(uint256 100 * loadLocal uint256 MANAGEMENT_FEE
         <= uint256 2 * loadLocal uint256 LP_INITIAL)`,
    ],
  },
  {
    txId: 72,
    requiredTxs: [6],
    signatory: GP.address,
    transaction: 'transferVar DAI GP CARRY',
    conditions: [
      `(balanceOf DAI TRANSACTIONS_CONT +
          loadLocal uint256 MANAGEMENT_FEE -
          loadLocal uint256 GP_INITIAL -
          loadLocal uint256 LP_INITIAL -
          loadLocal uint256 GP_REMAINING
       ) setUint256 PROFIT`,
      `(loadLocal uint256 LP_INITIAL *
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
      `
          (loadLocal uint256 LOSS > (loadLocal uint256 GP_INITIAL + loadLocal uint256 GP_REMAINING))
          ifelse WITHDRAW_ZERO WITHDRAW_NON_ZERO
          end

          WITHDRAW_ZERO {
            (uint256 0) setUint256 GP_TO_WITHDRAW
          }

          WITHDRAW_NON_ZERO {
            (loadLocal uint256 GP_INITIAL +
              loadLocal uint256 GP_REMAINING -
              loadLocal uint256 LOSS
            ) setUint256 GP_TO_WITHDRAW
          }
      `,
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
