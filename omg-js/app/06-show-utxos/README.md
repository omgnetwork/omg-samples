# Show UTXOs for Alice and Bob

_By the end of this tutorial you should know how to show UTXOs for Alice and Bob wallets._

## Intro

The example uses `getUtxos` function provided by the `Childchain` module of the `omg-js` library to show a list of unspent outputs (UTXOs) for Alice and Bob wallets.

## Prerequisites

1. Any number of UTXOs for Alice and Bob wallets.

## Steps

1. App setup
2. Loggins UTXOs for Alice and Bob

### 1. App setup

You can find the full Javascript segment of this tutorial in [show-utxos.js](./show-utxos.js). The first lines define dependent libraries, set up configs for child chain.

```
import { ChildChain } from "@omisego/omg-js";
import { stringify } from "omg-json-bigint";
import config from "../../config.js";

const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
```

### 2. Loggins UTXOs for Alice and Bob

Logging UTXOs helps to understand how many funds can be withdrawn to the rootchain. To perform this operation, use `getUtxos` function by the `Childchain` module provided by the `omg-js` library.

```
async function showUTXOs() {
  const aliceUtxos = await childChain.getUtxos(config.alice_eth_address);
  const bobUtxos = await childChain.getUtxos(config.bob_eth_address);

  console.log(`Alice UTXOs: ${stringify(aliceUtxos, undefined, 2)}`);
  console.log(`Bob UTXOs: ${stringify(bobUtxos, undefined, 2)}`);
}
```

Example output:

```
Alice UTXOs: [
 {
    "amount": 13000000000000000000,
    "blknum": 131002,
    "creating_txhash": null,
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "inserted_at": "2020-04-17T17:25:56Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-17T17:25:56Z",
    "utxo_pos": 131002000000000
  },
  {
    "amount": 1800000000000000000,
    "blknum": 144002,
    "creating_txhash": null,
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "inserted_at": "2020-04-21T12:23:03Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-21T12:23:03Z",
    "utxo_pos": 144002000000000
  },
  {
    "amount": 10000000000000000,
    "blknum": 145001,
    "creating_txhash": null,
    "currency": "0x0000000000000000000000000000000000000000",
    "inserted_at": "2020-04-22T08:06:22Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-22T08:06:22Z",
    "utxo_pos": 145001000000000
  },
  {
    "amount": 10000000000000000,
    "blknum": 145003,
    "creating_txhash": null,
    "currency": "0x0000000000000000000000000000000000000000",
    "inserted_at": "2020-04-22T08:08:16Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-22T08:08:16Z",
    "utxo_pos": 145003000000000
  },
  {
    "amount": 10000000000000000,
    "blknum": 147001,
    "creating_txhash": null,
    "currency": "0x0000000000000000000000000000000000000000",
    "inserted_at": "2020-04-23T08:07:42Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-23T08:07:42Z",
    "utxo_pos": 147001000000000
  },
  {
    "amount": 10000000000000000,
    "blknum": 147002,
    "creating_txhash": null,
    "currency": "0x0000000000000000000000000000000000000000",
    "inserted_at": "2020-04-23T09:34:46Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-23T09:34:46Z",
    "utxo_pos": 147002000000000
  },
  {
    "amount": 10000000000000000,
    "blknum": 147003,
    "creating_txhash": null,
    "currency": "0x0000000000000000000000000000000000000000",
    "inserted_at": "2020-04-23T11:24:46Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-23T11:24:46Z",
    "utxo_pos": 147003000000000
  }
]

Bob UTXOs: [
  {
    "amount": 340000000000000000,
    "blknum": 152000,
    "creating_txhash": "0x6840c4d5d365badf18dbfa490a39be0dd047368a78ea9e1bf71557a8a7aa2ab1",
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "inserted_at": "2020-04-24T22:22:34Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x8b63bb2b829813ece5c2f378d47b2862be271c6c",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-24T22:22:34Z",
    "utxo_pos": 152000000000000
  },
  {
    "amount": 340000000000000000,
    "blknum": 153000,
    "creating_txhash": "0xad01fc7fc17882a174bc4648ba81edaa1f5217729be9053ba478e7e5fdc61249",
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "inserted_at": "2020-04-24T22:35:01Z",
    "oindex": 0,
    "otype": 1,
    "owner": "0x8b63bb2b829813ece5c2f378d47b2862be271c6c",
    "spending_txhash": null,
    "txindex": 0,
    "updated_at": "2020-04-24T22:35:01Z",
    "utxo_pos": 153000000000000
  }
]

```

## Running the sample

1. Enter the `omg-js` folder if you're in the root `omg-samples` repository:

```
cd omg-js
```

2. Install dependencies:

```
npm install
```

3. Create `.env` file, modify configurations with required values (look at [.env.example](../../.env.example) or [README](../../README.md) of the `omg-js` repo for details).

4. Run the app:

```
npm run start
```

5. Open your browser at [http://localhost:3000](http://localhost:3000).

6. Select `06 - Show UTXOs` sample on the left side, observe the logs on the right.

![img](../assets/images/06.png)
