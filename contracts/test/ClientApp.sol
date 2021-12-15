//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../helpers/Storage.sol";
import "../Parser.sol";
import "hardhat/console.sol";

/**
 * @dev This is a simple example of the end user contract that uses our DSL
 */
contract ClientApp is Parser {
    using UnstructuredStorage for bytes4;

    bytes4 public constant IS_RISKY = bytes4(keccak256("IS_RISKY"));
    bytes4 public constant MIN_BLOCK = bytes4(keccak256("MIN_BLOCK"));

    string[] public withdrawalCond;

    constructor() {
        IS_RISKY.setStorageBool(true);
        MIN_BLOCK.setStorageUint256(block.timestamp + 1000);
    }

    function withdraw() external returns (bool) {
        require(withdrawalCond.length > 0, "Empty withdrawal condition");
        if (exec(withdrawalCond)) return payable(msg.sender).send(address(this).balance);
        return false;
    }

    function setWithdrawalCond(string[] memory _cond) external {
        withdrawalCond = _cond;
    }

    receive() external payable {}

    function isRisky() public view returns (bool) {
        return IS_RISKY.getStorageBool();
    }

    function currBlock() public view returns (uint256) {
        return block.timestamp;
    }

    function minBlock() public view returns (uint256) {
        return MIN_BLOCK.getStorageUint256();
    }

    function setIsRisky(bool _isRisky) public {
        IS_RISKY.setStorageBool(_isRisky);
    }

    function setMinBlock(uint256 _minBlock) public {
        MIN_BLOCK.setStorageUint256(_minBlock);
    }
}
