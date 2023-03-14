## CompoundBorrowing

This is a type of Agreement designed to perform a Nivaura Demo Phase II
https://docs.google.com/document/d/1wwEOXKa0cmmS0jM0p9q9rkltvEPmSuK3PuwPK-tapcs/edit

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _dslContext, uint256 step0Dea) public
```

Sets parser address, creates new Context instance, and setups Context

### _setDefaultVariables

```solidity
function _setDefaultVariables() internal
```

### _setParameters

```solidity
function _setParameters(uint256 _recordId, string _record, string _condition) internal
```

_Uploads pre-defined records to MultiTranche contract directly.
Uses a simple condition string `bool true`.
Records still have to be parsed using a preprocessor before execution. Such record becomes
non-upgradable. Check `isUpgradableRecord` modifier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the record ID |
| _record | string | is a string of the main record for execution |
| _condition | string | is a string of the condition that will be checked before record execution |

### _setBaseRecords

```solidity
function _setBaseRecords() internal
```

