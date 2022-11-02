import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { ParserMock } from '../../typechain-types/dsl/mocks';
import { hex4Bytes, checkStackTail } from '../utils/utils';
import { deployAgreementMock, deployParserMock } from '../../scripts/utils/deploy.utils.mock';
import {
  setApp,
  activateRecord,
  deactivateRecord,
  archiveRecord,
  unarchiveRecord,
  setRecord,
  setRecords,
  parseConditions,
  parseConditionsList,
} from '../../scripts/utils/update.record.mock';

import { deployPreprocessor } from '../../scripts/utils/deploy.utils';
import { AgreementMock, ContextMock__factory } from '../../typechain-types';
import { anyone, ONE_MONTH } from '../utils/constants';
import { Records } from '../types';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';

const { ethers, network } = hre;

describe('Records in Governance', () => {
  let app: AgreementMock;
  let multisig: MultisigMock;
  let appAddr: string;
  let parser: ParserMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;
  let preprAddr: string;
  let ContextCont: ContextMock__factory;

  const oneEth = ethers.utils.parseEther('1');
  const tenTokens = ethers.utils.parseEther('10');

  let records: Records[] = [];

  before(async () => {
    multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    [alice, bob, anybody] = await ethers.getSigners();
  });

  it('check execution of 4 pre-defined records', async () => {
    const ContextMock = await ethers.getContractFactory('ContextMock');
    const recordContext = await ContextMock.deploy();
    const conditionContext = await ContextMock.deploy();
    const recordContextAddr = recordContext.address;
    await setApp(recordContext, app, alice.address);
    await setApp(conditionContext, app, alice.address);

    const recordsId = 0;
    const signatories = [anyone];
    const conditionString = `bool true`;
    const transactionStr = `declareArr struct VOTERS 
        struct VOTE_YES { voter: msgSender, vote: YES }
        struct VOTE_NO { voter: msgSender, vote: NO }
      `;
  });
});
