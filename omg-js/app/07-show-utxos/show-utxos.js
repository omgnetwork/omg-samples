import { ChildChain } from "@omisego/omg-js";
import { stringify } from "omg-json-bigint";
import config from "../../config.js";

const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

async function childchainUtxos() {
  const aliceUtxos = await childChain.getUtxos(config.alice_eth_address);
  const bobUtxos = await childChain.getUtxos(config.bob_eth_address);

  console.log(`Alice UTXOs: ${stringify(aliceUtxos, undefined, 2)}`);
  console.log(`Bob UTXOs: ${stringify(bobUtxos, undefined, 2)}`);
}

export {childchainUtxos };
