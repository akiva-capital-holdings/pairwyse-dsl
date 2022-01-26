// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from "./IContext.sol";
import { Preprocessor } from "../Preprocessor.sol";
import { Opcodes } from "../Opcodes.sol";

interface IParser {
    // Variables

    // function opcodes() external returns (Opcodes);

    function preprocessor() external returns (Preprocessor);

    event ExecRes(bool result);
    event NewConditionalTx(address txObj);

    // Functions

    function parse(IContext _ctx, string memory _codeRaw) external;

    function initOpcodes(IContext _ctx) external;

    function asmLoadLocal(IContext _ctx) external;

    function asmLoadRemote(IContext _ctx) external;

    function asmBool() external;

    function asmUint256() external;

    function asmSend() external;

    function asmTransfer() external;

    function asmTransferFrom() external;
}
