## Governance

Financial Agreement written in DSL between two or more users
Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

<<<<<<< HEAD
### parser

```solidity
contract IParser parser
```

### context

```solidity
contract IContext context
```

### ownerAddr

```solidity
address ownerAddr
```

### preProc

```solidity
address preProc
```

### recordIds

```solidity
uint256[] recordIds
```

### contexts

```solidity
address[] contexts
```

### NewRecord

```solidity
event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string transaction, string[] conditionStrings)
```

### isReserved

```solidity
modifier isReserved(bytes32 position)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### isUpgradableRecord

```solidity
modifier isUpgradableRecord(uint256 _recordId)
```

### Record

```solidity
struct Record {
  address recordContext;
  bool isExecuted;
  bool isArchived;
  bool isActive;
  string transactionString;
}
```

### records

```solidity
mapping(uint256 => struct Governance.Record) records
=======
### deadline

```solidity
uint256 deadline
>>>>>>> 989c6dc (Separate context, simplify governance, upgrade agreement)
```

### baseRecord

```solidity
mapping(uint256 => bool) baseRecord
```

### constructor

```solidity
<<<<<<< HEAD
constructor(address _parser, address _ownerAddr, address[] _contexts) public
=======
constructor(address _parser, address _ownerAddr, address _token, address _dslContext, uint256 _deadline) public
>>>>>>> 989c6dc (Separate context, simplify governance, upgrade agreement)
```

Sets parser address, creates new Context instance, and setups Context

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
non-upgradable. Check `isUpgradableRecord` modifier
// TODO: add parameters in the doc_

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
