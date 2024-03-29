/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { UnstructuredStorageMock } from '../../dsl/mocks/UnstructuredStorageMock.sol';
import { Parser } from '../Parser.sol';

contract ParserMock is Parser, UnstructuredStorageMock {
    function asmLoadRemoteExt(bytes memory _program, address _dslCtxAddr, address) external {
        asmLoadRemote(_program, _dslCtxAddr, address(0));
    }
}
