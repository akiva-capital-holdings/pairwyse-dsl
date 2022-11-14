# Solidity DSL

### Install Dependencies

Execute: `yarn install`

### Compile contracts

Execute: `yarn hardhat compile`

### Localnodes

Run: `yarn hardhat node --network hardhat` to start a local node (in the separate terminal). Or use `yarn hardhat node --hostname 127.0.0.1 --port 7545` directly.

### Deploy the contracts on remote node

1. Open or create the .env file
2. Make sure the value is filled `REMOTE_GANACHE_URL= http://192.168.221.1:8545`
3. Open Pritunl and run VPN
4. Run: `npx hardhat run --network remoteGanache scripts/deploy.preprocessor.ts` to run a script

### Deploy the contracts

Run: `yarn hardhat run scripts/deploy.agreement.ts --network localhost` to run a script

### Deploy the contracts and verify on tenderly

Use `--network tenderly` flag
Ex.: `yarn hardhat run scripts/deploy.agreement.ts --network tenderly`

### Update AGREEMENT_ADDR in the .env file

`AGREEMENT_ADDR` variable is needed to test agreement smart contract in the local node.
In tests might be some issues if the address was provided incorectly or if this variable will be empty.

1. Open or create the .env file
2. Update the `AGREEMENT_ADDR` variable by the address that was provided after deployment script execution
   Ex. `AGREEMENT_ADDR=0x8C08821f5f94b519c853486eB131667AA528A460`

### Before pushing to repository

All tests marked as agreement (example: `test/agreement/agreement<*>.ts`) must be skipped. Example: `describe.only('Agreement: business case'...`

### Run tests

Use `yarn test` if it needs to run tests that not include agreement contract testing. All tests marked as agreement must be skipped.
Use `yarn test --network localhost` if it needs to run tests that include agreement contract testing. Be sure that the local node is ran on the separate terminal window. All tests marked as agreement must not be skipped. Example: `describe('Agreement: business case'...`

### Tests coverage

Use `yarn coverage` if it needs to check tests coverage that not include agreement contract testing.
Check the `coverage/` directory to see detailed HTML reports that were covered by tests.
