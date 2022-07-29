// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './IContext.sol';
import { Preprocessor } from '../Preprocessor.sol';

interface IParser {
    // Variables

    // function preprAddr() external returns (address);

    event ExecRes(bool result);
    event NewConditionalTx(address txObj);

    // Functions

    function parse(address _ctxAddr, string memory _codeRaw) external;

    function asmSetLocalBool() external;

    function asmSetUint256(IContext _ctx) external;

    function asmLoadLocal(IContext _ctx) external;

    function asmLoadRemote(IContext _ctx) external;

    function asmBool() external;

    function asmUint256() external;

    function asmSend() external;

    function asmTransfer() external;

    function asmTransferVar() external;

    function asmTransferFrom() external;

    function asmBalanceOf() external;

    function asmTransferFromVar() external;

    function asmIfelse() external;

    function asmIf() external;

    function asmFunc() external;
}
