import * as hre from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';
import { Suite } from 'mocha';
import dotenv from 'dotenv';
import { addSteps, businessCaseTest } from '../../utils/utils';
import { businessCaseSteps } from '../../../scripts/data/agreement';
import {
  deployAgreement,
  deployPreprocessor,
  deployStringUtils,
} from '../../../scripts/utils/deploy.utils';
import { ONE_MONTH } from '../../utils/constants';
import { DynamicTestData } from '../../types';

const { ethers, network } = hre;
dotenv.config();

const dynamicTestData = {} as DynamicTestData;

const parentSuite = describe('Agreement: Investment Fund. One LP', () => {
  let snapshotId: number;

  before(async () => {
    // Deploy the contracts
    const multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    const stringUtilsAddr = await deployStringUtils(hre);
    const agreementAddr = await deployAgreement(hre, multisig.address, stringUtilsAddr);
    const preprocessorAddr = await deployPreprocessor(hre);
    dynamicTestData.agreement = await ethers.getContractAt('Agreement', agreementAddr);
    [, , , dynamicTestData.whale, dynamicTestData.GP, ...dynamicTestData.LPs] =
      await ethers.getSigners();

    dynamicTestData.dai = await (await ethers.getContractFactory('ERC20Premint'))
      .connect(dynamicTestData.whale)
      .deploy('Token', 'TKN', parseUnits('100000000', 18));

    // Add all necessary Records
    // `base = 4` - steps for businessCases with one LP
    await addSteps(
      preprocessorAddr,
      businessCaseSteps(dynamicTestData.GP.address, [dynamicTestData.LPs[0].address], '4'),
      agreementAddr,
      multisig
    );

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;

    dynamicTestData.PLACEMENT_DATE = LAST_BLOCK_TIMESTAMP + ONE_MONTH; // NEXT_MONTH
    dynamicTestData.CLOSING_DATE = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH; // NEXT_TWO_MONTH
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });
});

const testNames = {
  scenario1: 'Scenario 1: LP deposits; GP balances; Profit Realized',
  scenario2: 'Scenario 2: GP fails to balance LP deposit',
  scenario3: 'Scenario 3: Loss incurred, fully covered by GP',
  scenario4: 'Scenario 4: Loss incurred, not fully covered by GP',
  scenario5: 'Scenario 5: Using bigger values, PURCHASE_PERCENT less than 90',
  scenario6: 'Scenario 6: GP_INITIAL less than needed',
  scenario7: 'Scenario 7: PURCHASE_PERCENT more than 90',
  scenario8: 'Scenario 8: HURDLE is 1 percent',
  scenario9: 'Scenario 9: MANAGEMENT_FEE_PERCENTAGE is 33%',
  scenario10: 'Scenario 10: Carry Charge is 0%',
  scenario11: 'Scenario 11: CAPITAL_GAINS capital gains is big',
  scenario12: 'Scenario 12: Smart contract does not store funds if values are small',
  scenario13: 'Scenario 13: Smart contract does not store funds if values too small',
  scenario14: 'Scenario 14: DEPOSIT_MIN_PERCENT is 1%',
  scenario15:
    'Scenario 15: Should be non zero value in the end of contract. Correct LP investment profit',
};

// Note: to disable any of the tests just comment out any test name from this array
const enabledTests: string[] = [
  testNames.scenario1,
  // testNames.scenario2,
  // testNames.scenario3,
  // testNames.scenario4,
  // testNames.scenario5,
  // testNames.scenario6,
  // testNames.scenario7,
  // testNames.scenario8,
  // testNames.scenario9,
  // testNames.scenario10,
  // testNames.scenario11,
  // testNames.scenario12,
  // testNames.scenario13,
  // testNames.scenario14,
  // testNames.scenario15,
];

const tests = {
  'Lifecycle Test one LP': [
    {
      base: '4',
      name: testNames.scenario1,
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
    {
      base: '4',
      name: testNames.scenario2,
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
      GP_FAILS_TO_DO_GAP_DEPOSIT: true,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario3,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('10', 18),
      CAPITAL_GAINS: parseUnits('0', 18),
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
    {
      base: '4',
      name: testNames.scenario4,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('100', 18),
      CAPITAL_GAINS: parseUnits('0', 18),
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
    {
      base: '4',
      name: testNames.scenario5,
      dynamicTestData,
      GP_INITIAL: parseUnits('20000', 18),
      LP_INITIAL_ARR: [parseUnits('990000', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200000', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 89,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario6,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990000', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('100000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200000', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 89,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario7,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 91,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario8,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 89,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 1,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario9,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 90,
      MANAGEMENT_FEE_PERCENTAGE: 33,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario10,
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
      PROFIT_PART: 0,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    {
      base: '4',
      name: testNames.scenario11,
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('990', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('333333', 18),
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
    {
      base: '4',
      name: testNames.scenario12,
      dynamicTestData,
      GP_INITIAL: parseUnits('1999999', 0),
      LP_INITIAL_ARR: [parseUnits('98555555', 0)],
      INITIAL_FUNDS_TARGET: parseUnits('99999999', 0),
      CAPITAL_LOSS: parseUnits('0', 0),
      CAPITAL_GAINS: parseUnits('23636363', 0),
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
    {
      base: '4',
      name: testNames.scenario13,
      dynamicTestData,
      GP_INITIAL: parseUnits('1998', 0),
      LP_INITIAL_ARR: [parseUnits('99999', 0)],
      INITIAL_FUNDS_TARGET: parseUnits('99900', 0),
      CAPITAL_LOSS: parseUnits('0', 0),
      CAPITAL_GAINS: parseUnits('19111', 0),
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
    {
      base: '4',
      name: testNames.scenario14,
      dynamicTestData,
      GP_INITIAL: parseUnits('10', 18),
      LP_INITIAL_ARR: [parseUnits('999', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200', 18),
      DEPOSIT_MIN_PERCENT: 1,
      PURCHASE_PERCENT: 90,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
    // TODO: check with Misha again
    // used the 34% / 66% percentage, as in the third agreement we have dividing values by 66 %
    // P1 = 100 - 34
    // ex. var DEPOSIT_MIN_PERCENT * var LP_INITIAL / var
    // P1
    {
      base: '4',
      name: testNames.scenario15,
      dynamicTestData,
      GP_INITIAL: parseUnits('340000', 0),
      LP_INITIAL_ARR: [parseUnits('900000', 0)],
      INITIAL_FUNDS_TARGET: parseUnits('1000000', 0),
      CAPITAL_LOSS: parseUnits('0', 0),
      CAPITAL_GAINS: parseUnits('340000', 0),
      DEPOSIT_MIN_PERCENT: 34,
      PURCHASE_PERCENT: 90,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
  ],
};

(Object.keys(tests) as (keyof typeof tests)[]).forEach((testBlockName) => {
  for (const test of tests[testBlockName]) {
    if (enabledTests.includes(test.name)) {
      businessCaseTest(test);
    }
  }
});
