/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { LinkedList } from '../helpers/LinkedList.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

contract BaseStorage is UnstructuredStorageMock, LinkedList {}
