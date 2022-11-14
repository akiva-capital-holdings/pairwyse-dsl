## MultisigMock

This is the contract that simulates Multisig. The contract just executes any transaction given to it without
any checks

### executeTransaction

```solidity
function executeTransaction(address _targetContract, bytes _payload, uint256 _value) external
```

Execute any transaction to any contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _targetContract | address | Contract which function should be called |
| _payload | bytes | Raw unsigned contract function call data with parameters |
| _value | uint256 | Optional value to send via the delegate call |

