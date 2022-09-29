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

    function asmSetLocalBool() external;

    function asmSetUint256(address _ctxAddr) external;

    function asmLoadLocal(address _ctxAddr) external;

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

    function asmTransferFromVar() external;

    function asmIfelse() external;

    function asmIf() external;

    function asmFunc() external;

    function asmGet() external;

    function asmPush() external;
}
