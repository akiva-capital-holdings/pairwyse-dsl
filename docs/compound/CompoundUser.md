## CompoundUser

_The contract that integrates with compounds and stores cTokens
check https://v2-app.compound.finance/ for more information
Note: Ethereum network_

### cUSDC

```solidity
address cUSDC
```

### USDC

```solidity
address USDC
```

### info

```solidity
mapping(address => uint256) info
```

### receive

```solidity
receive() external payable
```

### mint

```solidity
function mint(uint256 _amount) external
```

_Supply chosen token into the market_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | the amount of the underlying asset to supply |

### redeem

```solidity
function redeem() external
```

_Sender redeems all his cTokens in exchange for the underlying asset_

