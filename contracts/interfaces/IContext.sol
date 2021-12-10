//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Stack.sol";

interface IContext {
    enum BlockField {
        // current block’s base fee (EIP-3198 and EIP-1559)
        BASE_FEE, // 0x00
        // current chain id
        CHAIN_ID, // 0x01
        // current block miner’s address
        COINBASE,
        // current block difficulty
        DIFFICULTY,
        // current block gaslimit
        GASLIMIT,
        // current block number
        NUMBER, // 0x05
        // current block timestamp as seconds since unix epoch
        TIMESTAMP
    }

    function stack() external returns(Stack);
    function program() external returns(bytes memory);
    function pc() external returns(uint);
    function programAt(uint index, uint step) external view returns (bytes memory);
    function programSlice(bytes calldata payload, uint index, uint step) external pure returns (bytes memory);
    function setPc(uint value) external;
    function incPc(uint value) external;
}