import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Governance, Parser } from '../../typechain-types';
import { parseConditionsList } from './update.record.mock';

export const hex4Bytes = (hre: HardhatRuntimeEnvironment, str: string) =>
  hre.ethers.utils
    .keccak256(hre.ethers.utils.toUtf8Bytes(str))
    .split('')
    .map((x, i) => (i < 10 ? x : '0'))
    .join('');

export const setupGovernance = async (
  parser: Parser,
  preprAddr: string,
  governance: Governance
) => {
  const [setRecordID, yesRecordID, noRecordID, calcResRecordID] = [0, 1, 2, 3];
  const setRecord = await governance.records(setRecordID);
  const yesRecord = await governance.records(yesRecordID);
  const noRecord = await governance.records(noRecordID);
  const calcResRecord = await governance.records(calcResRecordID);

  // parse conditions list
  await parseConditionsList(
    [setRecordID, yesRecordID, noRecordID, calcResRecordID],
    parser,
    governance,
    preprAddr
  );

  // parse transaction
  await governance.parse(setRecord.transactionString, setRecord.recordContext, preprAddr);
  await governance.parse(yesRecord.transactionString, yesRecord.recordContext, preprAddr);
  await governance.parse(noRecord.transactionString, noRecord.recordContext, preprAddr);
  await governance.parse(calcResRecord.transactionString, calcResRecord.recordContext, preprAddr);

  // sets DSL code for the first record
  await governance.execute(setRecordID);
};
