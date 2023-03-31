/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { Executor } from '../libs/Executor.sol';
import { UnstructuredStorageMock } from './UnstructuredStorageMock.sol';

contract ExecutorMock is UnstructuredStorageMock {
    function execute(address _dslContext, address _programContext) public {
        Executor.execute(_dslContext, _programContext);
    }
}
