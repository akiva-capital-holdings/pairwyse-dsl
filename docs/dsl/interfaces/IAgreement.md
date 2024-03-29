## IAgreement

### Parsed

```solidity
event Parsed(address preProccessor, string code)
```

### RecordArchived

```solidity
event RecordArchived(uint256 recordId)
```

### RecordUnarchived

```solidity
event RecordUnarchived(uint256 recordId)
```

### RecordActivated

```solidity
event RecordActivated(uint256 recordId)
```

### RecordDeactivated

```solidity
event RecordDeactivated(uint256 recordId)
```

### RecordExecuted

```solidity
event RecordExecuted(address signatory, uint256 recordId, uint256 providedAmount, string record)
```

### NewRecord

```solidity
event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string record, string[] conditionStrings)
```

### Record

```solidity
struct Record {
  bool isExecuted;
  bool isArchived;
  bool isActive;
  uint256[] requiredRecords;
  address[] signatories;
  string recordString;
  string[] conditionStrings;
  bytes recordProgram;
  bytes[] conditions;
  mapping(address => bool) isExecutedBySignatory;
  mapping(string => bool) isConditionSet;
  mapping(string => bool) isRecordSet;
}
```

