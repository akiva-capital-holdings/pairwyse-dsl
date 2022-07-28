// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './IContext.sol';
import { Stack, StackValue } from '../helpers/Stack.sol';
import { StringUtils } from '../libs/StringUtils.sol';

// import 'hardhat/console.sol';

/**
 * @dev Preprocessor of DSL code
 *
 * One of the core contracts of the project. It can remove comments that were
 * created by user in the DSL code string. It transforms the users DSL code string
 * to the list of commands that can be used in a Parser contract.
 *
 * DSL code in postfix notation as
 * user's string code -> Preprocessor -> each command is separated in the commands list
 */
interface IPreprocessor {
    // uses for storing data for DSL functions
    struct FuncParameter {
        // the type of variable that provides for the function
        string _type;
        // the name of variable that will be generated in denedce on the function name
        string nameOfVariable;
        // the value for provided variable
        string value;
    }

    function transform(address _ctxAddr, string memory _program) external returns (string[] memory);

    function cleanString(string memory _program)
        external
        pure
        returns (string memory _cleanedProgram);

    function split(string memory _program) external returns (string[] memory);

    function infixToPostfix(
        address _ctxAddr,
        string[] memory _code,
        Stack _stack
    ) external returns (string[] memory);
}