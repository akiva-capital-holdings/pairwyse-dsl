## ContextFactory

### deployedContexts

```solidity
address[] deployedContexts
```

### NewContext

```solidity
event NewContext(address context)
```

### deployContext

```solidity
function deployContext(address _app) external returns (address _contextAddr)
```

Deploy new Context contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _app | address | Address of the end application |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _contextAddr | address | Address of a newly created Context |

### getDeployedContextsLen

```solidity
function getDeployedContextsLen() external view returns (uint256)
```

