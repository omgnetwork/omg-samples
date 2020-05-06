/*
  Copyright 2020 OmiseGO Pte Ltd
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import Web3 from "web3";
import { ChildChain, RootChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

// setup for only 1 transaction confirmation block for fast confirmations
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const rootChain = new RootChain({
  web3,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;

async function logBalances() {
  const aliceRootchainBalance = await OmgUtil.getErc20Balance({
    web3,
    address: aliceAddress,
    erc20Address: config.erc20_contract_address,
  });
  const aliceChildchainBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceErc20Object = aliceChildchainBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const aliceChildchainBalance = aliceErc20Object ? aliceErc20Object.amount : 0;

  console.log(
    `Alice's root chain ERC20 balance: ${web3.utils.fromWei(
      String(aliceRootchainBalance),
      "ether"
    )}`
  );
  console.log(
    `Alice's child chain ERC20 balance: ${web3.utils.fromWei(
      String(aliceChildchainBalance),
      "ether"
    )}`
  );
}

async function exitErc20() {
  if (!config.erc20_contract_address) {
    console.log("Please define an ERC20 contract in your .env");
    return;
  }
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  const aliceEtherBalance = web3.utils.fromWei(
    String(aliceRootchainBalance),
    "ether"
  );
  if (aliceEtherBalance < 0.001) {
    console.log(
      "Alice doesn't have enough ETH on the root chain to start an exit"
    );
    return;
  }
  await logBalances();
  console.log("-----");

  // get a ERC20 UTXO and exit data
  const aliceUtxos = await childChain.getUtxos(aliceAddress);
  const aliceUtxoToExit = aliceUtxos.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  if (!aliceUtxoToExit) {
    console.log("Alice doesn't have any ERC20 UTXOs to exit");
    return;
  }

  console.log(
    `Alice wants to exit ${web3.utils.fromWei(
      String(aliceUtxoToExit.amount),
      "ether"
    )} ERC20 with this UTXO:\n${JSON.stringify(aliceUtxoToExit, undefined, 2)}`
  );

  // check if queue exists for this token
  const hasToken = await rootChain.hasToken(config.erc20_contract_address);
  if (!hasToken) {
    console.log(`Adding a ${config.erc20_contract_address} exit queue`);
    await rootChain.addToken({
      token: config.erc20_contract_address,
      txOptions: { from: aliceAddress, privateKey: alicePrivateKey },
    });
  }

  // start a standard exit
  console.log("Starting a standard ERC20 exit...");
  const exitData = await childChain.getExitData(aliceUtxoToExit);
  const standardExitReceipt = await rootChain.startStandardExit({
    utxoPos: exitData.utxo_pos,
    outputTx: exitData.txbytes,
    inclusionProof: exitData.proof,
    txOptions: {
      privateKey: alicePrivateKey,
      from: aliceAddress,
      gas: 6000000,
    },
  });
  console.log(
    "Alice started a standard exit: " + standardExitReceipt.transactionHash
  );

  const exitId = await rootChain.getStandardExitId({
    txBytes: exitData.txbytes,
    utxoPos: exitData.utxo_pos,
    isDeposit: aliceUtxoToExit.blknum % 1000 !== 0,
  });
  console.log("Exit id: " + exitId);

  const { msUntilFinalization } = await rootChain.getExitTime({
    exitRequestBlockNumber: standardExitReceipt.blockNumber,
    submissionBlockNumber: aliceUtxoToExit.blknum,
  });

  console.log("Exit time: " + msUntilFinalization + " ms");
}

export { exitErc20 };
