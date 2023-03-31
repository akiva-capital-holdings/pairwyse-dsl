/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */

pragma solidity ^0.8.0;

interface IPreprocessor {
    function transform(
        address _ctxAddr,
        string memory _program
    ) external view returns (string[] memory);
}
