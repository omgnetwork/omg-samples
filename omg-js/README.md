# Omg-js Sample Application

## Description

A Javascript application that allows interacting with `omg-js` library. Examples provided in the project will help to deposit funds to the OMG Network, show the best ways to make transfers between the wallets, submit valid and challenge invalid exits.

## Contents

| File/folder            | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `app`                  | Sample source files.                                                 |
| `dist`                 | Build files that can be hosted on a server.                          |
| `01-balances`          | Implementation for retrieving root chain and child chain balances.   |
| `02-deposit-eth`       | Implementation for depositing ETH to the OMG Network.                |
| `03-deposit-erc20`     | Implementation for depositing ERC20 tokens to the OMG Network.       |
| `04-transaction-eth`   | Implementation for making ETH transactions on the OMG Network.       |
| `05-transaction-erc20` | Implementation for ERC-20 transactions on the OMG Network.           |
| `06-merge-utxos`       | Implementation for merging UTXOs of a given account.                 |
| `07-show-utxos`        | Implementation for showing UTXOs for a given account.                |
| `08-exit-eth`          | Implementation for exiting of ETH from the OMG Network.              |
| `09-exit-erc20`        | Implementation for exiting of ERC20 tokens from the OMG Network.     |
| `10-inflight-exit-eth` | Implementation for in-fligh exits of ETH funds from the OMG Network. |
| `11-process-exits`     | Implementation for processing exits on the OMG Network.              |
| `index.html`           | The UI of the sample.                                                |
| `.gitignore`           | Defines what to ignore at commit time.                               |
| `changelog.md`         | List of changes to the sample.                                       |
| `package.json`         | Package manifest for npm.                                            |
| `README.md`            | Project's README file.                                               |
| `LICENSE`              | The license for the sample.                                          |
| `config.js`            | Configuration parameters for the sample.                             |
| `server.js`            | Implements a simple Node server to serve index.html.                 |

## Prerequisites

- [Node](https://nodejs.org/en) >= 8.11.3 < 13.0.0
- Basic understanding of Ethereum and the OMG Network concepts: UTXOs, gas, smart contracts, deposits, transfers, exits, challenges.
- Access to two Web3 wallets where you can export private keys. Consider using [MetaMask](https://metamask.io/download.html) if you want flexibility in working with ERC20 tokens.
- Funds on both of the Web3 wallets. For working with a testnet, you can get free tokens using [MetaMask Ropsten faucet](https://faucet.metamask.io).

## Setup

1. Clone OMG code samples repository:

```
git clone https://github.com/omisego/omg-samples.git
```

2. Enter the root of `omg-js` folder:

```
cd omg-js
```

3. Install dependencies:

```
npm install
```

4. Create `.env` file and provide the required configuration values:

```
ETH_NODE=                           <entry point to an ethereum node>
WATCHER_URL=                        <url of an informational watcher>
WATCHER_PROXY_URL=                  <*optional* proxy server to catch all watcher requests>
PLASMAFRAMEWORK_CONTRACT_ADDRESS=   <address of the plasma_framework contract>
ERC20_CONTRACT_ADDRESS=             <*optional* address of the erc20 contract that Alice will deposit and transfer to Bob>
MILLIS_TO_WAIT_FOR_NEXT_BLOCK=      <interval when checking for block confirmation>
BLOCKS_TO_WAIT_FOR_TXN=             <amount of blocks to wait for confirmation>
ALICE_ETH_ADDRESS=                  <address of Alice's account>
ALICE_ETH_ADDRESS_PRIVATE_KEY=      <Alice's private key>
BOB_ETH_ADDRESS=                    <address of Bob's account>
BOB_ETH_ADDRESS_PRIVATE_KEY=        <Bob's private key>
```

- You can set up `ETH_NODE` by launching a local Ethereum node. But due to substantial time consumption this process requires, it's recommended using one of the services that provide such functionality for free: [Infura](https://infura.io), [QuickNode](https://www.quiknode.io), [Rivet](https://rivet.cloud).
- If you encounter some issues with connecting to the network, make sure to check the latest details for `WATCHER_URL`, `PLASMAFRAMEWORK_CONTRACT_ADDRESS` on [the official documentation page](https://docs.omg.network/network-connection-details).
- Put `WATCHER_PROXY_URL` only if you run your watcher. Otherwise, you might not be able to run any of the code samples in this project.
- To find `ERC20_CONTRACT_ADDRESS` for a particular token you want to use, check [Etherscan Token Tracker](https://etherscan.io/tokens). If you're looking for ERC20 faucets, you can send 0 Ropsten ETH to a corresponding smart contract. Some of the projects typically send back test tokens to work with.
- In most of the code samples, Alice refers to the account of a sender, Bob refers to the account that receives funds.

Feel free to use the following configurations if you don't have time to set up your own:

```
WATCHER_URL=https://watcher-info.ropsten.v1.omg.network
WATCHER_PROXY_URL=
PLASMAFRAMEWORK_CONTRACT_ADDRESS=0x96d5d8bc539694e5fa1ec0dab0e6327ca9e680f9
ERC20_CONTRACT_ADDRESS=0xd74ef52053204c9887df4a0e921b1ae024f6fe31
ALICE_ETH_ADDRESS=0x0dC8e240d90F3B0d511b6447543b28Ea2471401a
ALICE_ETH_ADDRESS_PRIVATE_KEY=0xCD5994C7E2BF03202C59B529B76E5582266CEB384F02D32B470AC57112D0C6E7
BOB_ETH_ADDRESS=0x8b63BB2B829813ECe5C2F378d47b2862bE271c6C
BOB_ETH_ADDRESS_PRIVATE_KEY=0x1027c05dcc6dba6b8fb6bb6efc90e374fee7da73e1069279be61a2dcf533b856
MILLIS_TO_WAIT_FOR_NEXT_BLOCK=1000
BLOCKS_TO_WAIT_FOR_TXN=20
```

> Private keys presented in this config file have only Ropsten testnet tokens. Please, spend them considerably, share with others. Make sure to never share your private keys to anyone if you deal with real funds (Ethereum mainnet).

## Running the sample

1. Modify `entry` property of the `webpack.config.js` file to match the sample you want to run:

```
entry: {
  app: "./app/<SAMPLE_FOLDER>/<SAMPLE_JS_FILE_NAME>",
}
```

Example:

```
entry: {
  app: "./app/01-balances/balances.js",
}
```

2. Run the Webpack and Webpack server:

```
npm run start
```

You will see a new `dist` folder created with static `bundle.js` and `index.html` files.

3. Open your browser and development console at [http://localhost:3000](http://localhost:3000) to follow code sample logs.

![](https://i.imgur.com/SBZgfef.png)

## Contributing

This project welcomes contributions and suggestions. Please follow the contribution flow as stated below:

1. Clone the repository.
2. Checkout to the branch with `<GIT_USERNAME>/dev` name.
3. Make changes.
4. Submit PR to the latest version branch (e.g. 1.3.1). Please, don't submit PRs to the master branch, they will be rejected automatically.
