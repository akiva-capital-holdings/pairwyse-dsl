pragma solidity ^0.8.0;

/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */

import '../helpers/Stack.sol';

interface IDSLContext {
    enum OpcodeLibNames {
        BranchingOpcodes,
        ComparisonOpcodes,
        ComplexOpcodes,
        LogicalOpcodes,
        OtherOpcodes
    }

    function branchingOpcodes() external view returns (address);

    function comparisonOpcodes() external view returns (address);

    function complexOpcodes() external view returns (address);

    function logicalOpcodes() external view returns (address);

    function otherOpcodes() external view returns (address);

    function opCodeByName(string memory _name) external view returns (bytes1 _opcode);

    function selectorByOpcode(bytes1 _opcode) external view returns (bytes4 _selecotor);

    function numOfArgsByOpcode(string memory _name) external view returns (uint8 _numOfArgs);

    function isCommand(string memory _name) external view returns (bool _isCommand);

    function opcodeLibNameByOpcode(bytes1 _opcode) external view returns (OpcodeLibNames _name);

    function asmSelectors(string memory _name) external view returns (bytes4 _selecotor);

    function opsPriors(string memory _name) external view returns (uint256 _priority);

    function operators(uint256 _index) external view returns (string memory _operator);

    function branchSelectors(
        string memory _baseOpName,
        bytes1 _branchCode
    ) external view returns (bytes4 _selector);

    function branchCodes(
        string memory _baseOpName,
        string memory _branchName
    ) external view returns (bytes1 _branchCode);

    function aliases(string memory _alias) external view returns (string memory _baseCmd);

    // Functions
    function operatorsLen() external view returns (uint256);
}
