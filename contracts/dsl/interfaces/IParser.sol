// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from './IDSLContext.sol';
import { Preprocessor } from '../Preprocessor.sol';

interface IParser {
    // Variables

    event ExecRes(bool result);
    event NewConditionalTx(address txObj);

    // Functions

    function parse(
        address _preprAddr,
        address _dslCtxAddr,
        address _programCtxAddr,
        string memory _codeRaw
    ) external;

    function parseCode(
        address _dslCtxAddr,
        address _programCtxAddr,
        string[] memory _code
    ) external;

    function asmSetLocalBool(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmSetUint256(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmVar(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmLoadRemote(
        bytes memory _program,
        address _ctxDSLAddr,
        address
    ) external returns (bytes memory newProgram);

    function asmDeclare(
        bytes memory _program,
        address _ctxDSLAddr,
        address
    ) external returns (bytes memory newProgram);

    function asmBool(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmUint256(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmSend(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmTransfer(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmTransferVar(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmTransferFrom(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmBalanceOf(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmLengthOf(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmSumOf(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmSumThroughStructs(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmTransferFromVar(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmIfelse(
        bytes memory _program,
        address _ctxDSLAddr,
        address _programCtxAddr
    ) external returns (bytes memory newProgram);

    function asmIf(
        bytes memory _program,
        address _ctxDSLAddr,
        address _programCtxAddr
    ) external returns (bytes memory newProgram);

    function asmFunc(
        bytes memory _program,
        address _ctxDSLAddr,
        address _programCtxAddr
    ) external returns (bytes memory newProgram);

    function asmGet(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmPush(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmStruct(
        bytes memory _program,
        address _ctxDSLAddr,
        address _programCtxAddr
    ) external returns (bytes memory newProgram);

    function asmForLoop(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);

    function asmEnableRecord(
        bytes memory _program,
        address,
        address
    ) external returns (bytes memory newProgram);
}
