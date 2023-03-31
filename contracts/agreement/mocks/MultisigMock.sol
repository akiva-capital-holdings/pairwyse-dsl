pragma solidity ^0.8.0;

/**
 * (c) 2023 Akiva Capital Holdings, LLC.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */

/**
 * This is the contract that simulates Multisig. The contract just executes any transaction given to it without
 * any checks
 */
contract MultisigMock {
    /**
     * Execute any transaction to any contract
     * @param _targetContract Contract which function should be called
     * @param _payload Raw unsigned contract function call data with parameters
     * @param _value Optional value to send via the delegate call
     */
    function executeTransaction(
        address _targetContract,
        bytes memory _payload,
        uint256 _value
    ) external {
        (bool success, ) = _targetContract.call{ value: _value }(_payload);
        require(success, 'Delegate call failure');
    }
}
