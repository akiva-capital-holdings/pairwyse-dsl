// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { UnstructuredStorageMock } from '../../dsl/mocks/UnstructuredStorageMock.sol';
import { Parser } from '../Parser.sol';

contract ParserMock is Parser, UnstructuredStorageMock {
    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    function parseCodeExt(address _ctxAddr, string[] memory _code) external {
        _parseCode(_ctxAddr, _code);
    }

    // function setVariableExt(
    //     address _ctxAddr,
    //     string memory _name,
    //     string memory _type
    // ) external {
    //     _setVariable(_ctxAddr, _name, _type);
    // }

    function asmLoadRemoteExt(address _ctxAddr) external {
        asmLoadRemote(_ctxAddr);
    }
}
