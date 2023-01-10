## MultiTranche

### deadline

```solidity
uint256 deadline
```

### baseRecord

```solidity
mapping(uint256 => bool) baseRecord
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _dslContext) public
```

Sets parser address, creates new Context instance, and setups Context

### execute

```solidity
function execute(uint256 _recordId) external payable
```

_Check if the recorcID is executable (validate all conditions before
record execution, check signatures)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### _setBaseRecords

```solidity
function _setBaseRecords() internal
```

_Uploads 4 pre-defined records to Governance contract directly_

### _setParameters

```solidity
function _setParameters(uint256 _recordId, string _record, string _condition, uint256 _requiredRecordsLength) internal
```

_Uploads 4 pre-defined records to Governance contract directly.
Uses a simple condition string `bool true`.
Records still have to be parsed using a preprocessor before execution. Such record becomes
non-upgradable. Check `isUpgradableRecord` modifier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the record ID |
| _record | string | is a string of the main record for execution |
| _condition | string | is a string of the condition that will be checked before record execution |
| _requiredRecordsLength | uint256 | is a flag for required records before execution |

### _setEnterRecord

```solidity
function _setEnterRecord() internal
```

### _setDepositAllRecord

```solidity
function _setDepositAllRecord() internal
```

### _setWithdrawRecord

```solidity
function _setWithdrawRecord() internal
```

