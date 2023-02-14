## Governance

Financial Agreement written in DSL between two or more users
Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

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
constructor(address _parser, address _ownerAddr, address _token, address _dslContext, uint256 _deadline) public
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

### _setBaseRecord

```solidity
function _setBaseRecord() internal
```

_Declares VOTERS list that will contain structures.
In additional to that declares two structures that will be
used for YES/NO voting_

### _setYesRecord

```solidity
function _setYesRecord() internal
```

_Inserts VOTE_YES structure to the VOTERS list,
this record can be executed only if deadline is not occurred
TODO: and balance for
msg.sender of Governance token will be more that 0_

### _setNoRecord

```solidity
function _setNoRecord() internal
```

_Inserts VOTE_NO structure to the VOTERS list,
this record can be executed only if deadline is not occurred
TODO: and balance for
msg.sender of Governance token will be more that 0_

### _setCheckVotingRecord

```solidity
function _setCheckVotingRecord() internal
```

_Sums up the results of the voting, if results are more than 50%
the record that is set as RECORD_ID for AGREEMENT_ADDR will be activated
otherwise, the RECORD_ID record won't be activated.
This record can be executed only if the deadline has already occurred
TODO: change RECORD_ID and AGREEMENT_ADDR to the dynamical inside of
the governance contract_

### _setBaseRecordStatus

```solidity
function _setBaseRecordStatus(uint256 _recordId) internal
```

_Sets the record as base record for the Governance contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the record ID |

