import { ChildChain, OmgUtil } from "@omisego/omg-js";
import JSONBigNumber from "omg-json-bigint";
import config from "../../config.js";
import wait from "../helpers/wait.js";

const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;

async function mergeUtxo() {
  const aliceUtxosAll = await childChain.getUtxos(aliceAddress);
  const aliceEthUtxos = aliceUtxosAll.filter(
    (u) => u.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const aliceErc20Utxos = aliceUtxosAll.filter(
    (u) =>
      u.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );

  console.log(
    `Alice has ${aliceEthUtxos.length} ETH UTXOs and ${aliceErc20Utxos.length} ERC20 UTXOs`
  );

  console.log(
    `Alice ETH UTXOs: ${JSONBigNumber.stringify(aliceEthUtxos, undefined, 2)}`
  );
  console.log(
    `Alice ERC20 UTXOs: ${JSONBigNumber.stringify(
      aliceErc20Utxos,
      undefined,
      2
    )}`
  );

  if (aliceUtxosAll.length > 1) {
    console.log("Merging ERC20 UTXOs");
    const utxosToMerge = aliceEthUtxos.slice(0, 4);
    const utxo = await childChain.mergeUtxos({
      utxos: utxosToMerge,
      privateKey: alicePrivateKey,
      verifyingContract: config.plasmaframework_contract_address,
    });

    console.log(
      "Merge UTXO transaction result: " + JSON.stringify(utxo, undefined, 2)
    );
    await wait.waitForUtxo(childChain, aliceAddress, {
      ...utxo,
      oindex: 0,
    });

    const newAliceUtxos = await childChain.getUtxos(aliceAddress);
    console.log(
      `Merged Alice UTXOs: ${JSONBigNumber.stringify(
        newAliceUtxos,
        undefined,
        2
      )}`
    );
    console.log(`Alice UTXOs has length of ${newAliceUtxos.length}`);
  } else {
    console.log(
      "You have less than two UTXOs. The minimum number to merge is 2. Make a deposit and get back."
    );
  }
}

export { mergeUtxo };
