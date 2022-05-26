# Solidity DSL

Run: `npx hardhat compile` to compile contracts
Run: `npx hardhat node --network hardhat` to start a local node (in the separate terminal). Or use `npx hardhat node --hostname 127.0.0.1` directly.

### Deploy the contracts
Run: `npx hardhat run scripts/deploy.agreement.ts --network localhost` to run a script

### Update AGREEMENT_ADDR in the .env file
`AGREEMENT_ADDR` variable is needed to test agreement smart contract in the local node.
In tests might be some issues if the address was provided incorectly or if this variable will be empty.
1. Open or create the .env file
2. Update the `AGREEMENT_ADDR` variable by the address that was provided after deployment script execution
Ex. `AGREEMENT_ADDR=0x8C08821f5f94b519c853486eB131667AA528A460`

### Run tests
Use `yarn test` if it needs to run tests that not include agreement contract testing.
Use `yarn test --network localhost` if it needs to run tests that include agreement contract testing.Be sure that the local node is ran on the separate terminal window.