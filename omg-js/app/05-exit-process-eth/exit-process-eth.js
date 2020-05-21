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
import { RootChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

// setup for fast confirmations
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});

const rootChain = new RootChain({
  web3,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const token = OmgUtil.transaction.ETH_CURRENCY;

async function exitProcessEth() {
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  console.log(
    `Alice's root chain balance: ${web3.utils.fromWei(
      String(aliceRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log("-----");

  const ethQueue = await rootChain.getExitQueue();
  const ethQueueHuman = ethQueue.map((e) => {
    const container = {};
    container.priority = e.priority;
    container.exitableAt = new Date(
      parseInt(e.exitableAt * 1000)
    ).toLocaleString();
    container.exitId = e.exitId;
    return container;
  });
  if (ethQueue.length) {
    console.log(
      "Current ETH exit queue: " + JSON.stringify(ethQueueHuman, null, 2)
    );
    console.log("Processing exit...");

    const ethExitReceipt = await rootChain.processExits({
      token: token,
      exitId: 0,
      maxExitsToProcess: 1,
      txOptions: {
        privateKey: alicePrivateKey,
        from: aliceAddress,
        gas: 6000000,
      },
    });
    if (ethExitReceipt) {
      console.log(`ETH exits processing: ${ethExitReceipt.transactionHash}`);
      await OmgUtil.waitForRootchainTransaction({
        web3,
        transactionHash: ethExitReceipt.transactionHash,
        checkIntervalMs: config.millis_to_wait_for_next_block,
        blocksToWait: config.blocks_to_wait_for_txn,
        onCountdown: (remaining) =>
          console.log(`${remaining} blocks remaining before confirmation`),
      });
      console.log("ETH exits processed");
    }
  } else {
    console.log("No exits in ETH exit queue to process");
  }
}

export { exitProcessEth };
