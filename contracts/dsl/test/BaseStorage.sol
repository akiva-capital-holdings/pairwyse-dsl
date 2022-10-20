// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { LinkedList } from '../helpers/LinkedList.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

contract BaseStorage is UnstructuredStorageMock, LinkedList {}
