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
const erc20ContractAddress = config.erc20_contract_address;
const token = config.erc20_contract_address;

async function exitProcessErc20() {
  const aliceRootchainBalance = await OmgUtil.getErc20Balance({
    web3,
    address: aliceAddress,
    erc20Address: erc20ContractAddress,
  });
  console.log(
    `Alice's root chain balance: ${web3.utils.fromWei(
      String(aliceRootchainBalance),
      "ether"
    )} ERC20`
  );
  console.log("-----");

  if (!token) {
    console.log("No ERC20 contract defined in config");
    return;
  }
  const erc20Queue = await rootChain.getExitQueue(token);
  const erc20QueueHuman = erc20Queue.map((e) => {
    const container = {};
    container.priority = e.priority;
    container.exitableAt = new Date(
      parseInt(e.exitableAt * 1000)
    ).toLocaleString();
    container.exitId = e.exitId;
    return container;
  });
  if (erc20Queue.length) {
    console.log(
      "Current ERC20 exit queue: " + JSON.stringify(erc20QueueHuman, null, 2)
    );
    console.log("Processing exit...");

    const erc20ExitReceipt = await rootChain.processExits({
      token: token,
      exitId: 0,
      maxExitsToProcess: 1,
      txOptions: {
        privateKey: alicePrivateKey,
        from: aliceAddress,
        gas: 6000000,
      },
    });
    if (erc20ExitReceipt) {
      console.log(
        `ERC20 exits processing: ${erc20ExitReceipt.transactionHash}`
      );
      await OmgUtil.waitForRootchainTransaction({
        web3,
        transactionHash: erc20ExitReceipt.transactionHash,
        checkIntervalMs: config.millis_to_wait_for_next_block,
        blocksToWait: config.blocks_to_wait_for_txn,
        onCountdown: (remaining) =>
          console.log(`${remaining} blocks remaining before confirmation`),
      });
      console.log("ERC20 exits processed");
    }
  } else {
    console.log("No exits in ERC20 exit queue to process");
  }
}

export { exitProcessErc20 };
