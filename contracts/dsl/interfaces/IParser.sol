// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './IContext.sol';
import { Preprocessor } from '../Preprocessor.sol';

interface IParser {
    // Variables

    event ExecRes(bool result);
    event NewConditionalTx(address txObj);

    // Functions

    function parse(
        address _preprAddr,
        address _ctxAddr,
        string memory _codeRaw
    ) external;

    function parseCode(address _ctxAddr, string[] memory _code) external;

    function asmSetLocalBool() external;

    function asmSetUint256() external;

    function asmVar() external;

    function asmLoadRemote(address _ctxAddr) external;

    function asmDeclare(address _ctxAddr) external;

    function asmBool() external;

    function asmUint256() external;

    function asmSend() external;

    function asmTransfer() external;

    function asmTransferVar() external;

    function asmTransferFrom() external;

    function asmBalanceOf() external;

    function asmLengthOf() external;

    function asmSumOf() external;

    function asmSumThroughStructs() external;

    function asmTransferFromVar() external;

    function asmIfelse() external;

    function asmIf() external;

    function asmFunc() external;

    function asmGet() external;

    function asmPush() external;

    function asmStruct(address _ctxAddr) external;

    function asmForLoop() external;
}
