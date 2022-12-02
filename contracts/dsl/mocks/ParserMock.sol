// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { UnstructuredStorageMock } from '../../dsl/mocks/UnstructuredStorageMock.sol';
import { Parser } from '../Parser.sol';

contract ParserMock is Parser, UnstructuredStorageMock {
    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    function asmLoadRemoteExt(bytes memory _program, address _dslCtxAddr, address) external {
        asmLoadRemote(_program, _dslCtxAddr, address(0));
    }
}
