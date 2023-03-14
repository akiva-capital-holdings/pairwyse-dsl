# Setup Front End on a new network

1. Run `npx hardhat --network <target network> deploy:main`
2. `npx hardhat --network <target network> bytecode:agreement --executor <executor address from the output of the previous command>`
3. Open the newly generated `bytecode/agreement.bytecode` file and copy-pase its content into `src/data/agreement.json` file (`bytecode` section) on the Front End.
4. Deploy the Front End and run in on the <target network>.
