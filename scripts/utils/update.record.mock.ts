import { expect } from 'chai';
import * as hre from 'hardhat';

import { AgreementMock } from '../../typechain-types';
import { ParserMock } from '../../typechain-types/dsl/mocks';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';
import { Records } from '../../test/types';

const { ethers, network } = hre;

const executeTransaction = async (_appAddr: string, _multisig: MultisigMock, _data: string) => {
  await _multisig.executeTransaction(_appAddr, _data, 0);
};

export const activateRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.activateRecord(_recordId);
  await executeTransaction(_app.address, _multisig, data as string);
};

export const deactivateRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.deactivateRecord(_recordId);
  await executeTransaction(_app.address, _multisig, data as string);
};

export const archiveRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.archiveRecord(_recordId);
  await executeTransaction(_app.address, _multisig, data as string);
};

export const unarchiveRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.unArchiveRecord(_recordId);
  await executeTransaction(_app.address, _multisig, data as string);
};

export const setRecord = async (data: any, app: AgreementMock) => {
  const {
    recordId,
    requiredRecords,
    signatories,
    conditionContexts,
    conditionStrings,
    transactionCtx,
    transactionStr,
  } = data;

  await app.addRecordBlueprint(recordId, requiredRecords, signatories);
  for (let j = 0; j < conditionContexts.length; j++) {
    await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
  }
  await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);
};

export const setRecords = async (records: Records[], app: AgreementMock) => {
  for (let i = 0; i < records.length; i++) {
    await setRecord(records[i], app);
  }
};

export const parseConditions = async (
  recordId: number,
  parser: ParserMock,
  app: AgreementMock,
  preprAddr: string
) => {
  const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();
  for (let j = 0; j < condCtxLen; j++) {
    await parser.parse(
      preprAddr,
      await app.conditionContexts(recordId, j),
      await app.conditionStrings(recordId, j)
    );
  }
};
