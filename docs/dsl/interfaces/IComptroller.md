## IComptroller

_Base Interface of the Comptroller

 Proxy:
 https://github.com/compound-finance/compound-protocol/blob/master/contracts/Unitroller.sol

	Comptroller:
https://github.com/compound-finance/compound-protocol/blob/master/contracts/Comptroller.sol
 goerli 0x05Df6C772A563FfB37fD3E04C1A279Fb30228621_

### markets

```solidity
function markets(address) external returns (bool, uint256)
```

### checkMembership

```solidity
function checkMembership(address account, contract IcToken cToken) external view returns (bool)
```

### enterMarkets

```solidity
function enterMarkets(address[]) external returns (uint256[])
```

### getAccountLiquidity

```solidity
function getAccountLiquidity(address) external view returns (uint256, uint256, uint256)
```

