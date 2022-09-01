import { ethers, network } from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';
import { Suite } from 'mocha';
import dotenv from 'dotenv';
import { addSteps, businessCaseTest } from '../../utils/utils';
import { businessCaseSteps } from '../../../scripts/data/agreement';
import { deployAgreement, deployPreprocessor } from '../../../scripts/data/deploy.utils';
import { ONE_MONTH } from '../../utils/constants';
import { DynamicTestData } from '../../types';

dotenv.config();

const dynamicTestData = {} as DynamicTestData;

const parentSuite = describe('Agreement: Investment Fund', () => {
  let snapshotId: number;

  before(async () => {
    // Deploy the contracts
    const agreementAddr = await deployAgreement();
    const preprocessorAddr = await deployPreprocessor();
    dynamicTestData.agreement = await ethers.getContractAt('Agreement', agreementAddr);
    [, , , dynamicTestData.whale, dynamicTestData.GP, ...dynamicTestData.LPs] =
      await ethers.getSigners();

    dynamicTestData.dai = await (await ethers.getContractFactory('Token'))
      .connect(dynamicTestData.whale)
      .deploy(parseUnits('100000000', 18));

    // Add all necessary Records
    // `base = 4` - steps for businessCases with one LP
    await addSteps(
      preprocessorAddr,
      businessCaseSteps(dynamicTestData.GP.address, [dynamicTestData.LPs[0].address], '4'),
      agreementAddr
    );

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;

    dynamicTestData.PLACEMENT_DATE = LAST_BLOCK_TIMESTAMP + ONE_MONTH; // NEXT_MONTH
    dynamicTestData.CLOSING_DATE = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH; // NEXT_TWO_MONTH

    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });
});

const tests = {
  'Lifecycle Test one LP': [
    {
      base: '4',
      name: 'Scenario 1: LP deposits; GP balances; Profit Realized',
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 90,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    // {
    //   base: '4',
    //   name: 'Scenario 2:  GP fails to balance LP deposit',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: true,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 3:  Loss incurred, fully covered by GP',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('10', 18),
    //   CAPITAL_GAINS: parseUnits('0', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 4:  Loss incurred, not fully covered by GP',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('100', 18),
    //   CAPITAL_GAINS: parseUnits('0', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 5: Using bigger values, PURCHASE_PERCENT less than 90',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20000', 18),
    //   LP_INITIAL_ARR: [parseUnits('990000', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200000', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 89,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 6:  GP_INITIAL less than needed',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990000', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('100000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200000', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 89,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 7:  PURCHASE_PERCENT more than 90',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 91,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 8:  HURDLE is 1 percent',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 89,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 1,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 9:  MANAGEMENT_FEE_PERCENTAGE is 33%',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 33,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 10:  Carry Charge is 0%',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 0,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 11:  CAPITAL_GAINS capital gains is big',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('20', 18),
    //   LP_INITIAL_ARR: [parseUnits('990', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('333333', 18),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 12: smart contract does not store funds if values are small',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('1999999', 0),
    //   LP_INITIAL_ARR: [parseUnits('98555555', 0)],
    //   INITIAL_FUNDS_TARGET: parseUnits('99999999', 0),
    //   CAPITAL_LOSS: parseUnits('0', 0),
    //   CAPITAL_GAINS: parseUnits('23636363', 0),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 13:  smart contract does not store funds if values too small',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('1998', 0),
    //   LP_INITIAL_ARR: [parseUnits('99999', 0)],
    //   INITIAL_FUNDS_TARGET: parseUnits('99900', 0),
    //   CAPITAL_LOSS: parseUnits('0', 0),
    //   CAPITAL_GAINS: parseUnits('19111', 0),
    //   DEPOSIT_MIN_PERCENT: 2,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // {
    //   base: '4',
    //   name: 'Scenario 14: DEPOSIT_MIN_PERCENT is 1%',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('10', 18),
    //   LP_INITIAL_ARR: [parseUnits('999', 18)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
    //   CAPITAL_LOSS: parseUnits('0', 18),
    //   CAPITAL_GAINS: parseUnits('200', 18),
    //   DEPOSIT_MIN_PERCENT: 1,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
    // // TODO: check with Misha again
    // // used the 34% / 66% percentage, as in the third agreement we have dividing values by 66 %
    // // P1 = 100 - 34
    // // ex. loadLocal uint256 DEPOSIT_MIN_PERCENT * loadLocal uint256 LP_INITIAL / loadLocal uint256
    // // P1
    // {
    //   base: '4',
    //   name: 'Scenario 15: Should be non zero value in the end of contract. \
    //   Correct LP investment profit',
    //   dynamicTestData,
    //   GP_INITIAL: parseUnits('340000', 0),
    //   LP_INITIAL_ARR: [parseUnits('900000', 0)],
    //   INITIAL_FUNDS_TARGET: parseUnits('1000000', 0),
    //   CAPITAL_LOSS: parseUnits('0', 0),
    //   CAPITAL_GAINS: parseUnits('340000', 0),
    //   DEPOSIT_MIN_PERCENT: 34,
    //   PURCHASE_PERCENT: 90,
    //   MANAGEMENT_FEE_PERCENTAGE: 2,
    //   HURDLE: 9,
    //   PROFIT_PART: 20,
    //   GP_FAILS_TO_DO_GAP_DEPOSIT: false,
    //   get suiteInstance() {
    //     return Suite.create(parentSuite, this.name);
    //   },
    // },
  ],
};

(Object.keys(tests) as (keyof typeof tests)[]).forEach((testBlockName) => {
  for (const test of tests[testBlockName]) {
    businessCaseTest(test);
  }
});
