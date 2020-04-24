import { logBalances } from "./01-balances/balances";
import { depositETH } from "./02-deposit-eth/deposit-eth";
import { depositERC20 } from "./03-deposit-erc20/deposit-erc20";
import config from "../config";
import "./assets/styles.scss";

// SAMPLES
const samples = [
  {
    title: "01 - Retrieve Balances",
    script: logBalances,
    code: "",
    readme: "",
  },
  {
    title: "02 - Make a Deposit ETH",
    script: depositETH,
    code: "",
    readme: "",
  },
  {
    title: "03 - Make a Deposit ERC20",
    script: depositERC20,
    code: "",
    readme: "",
  },
  {
    title: "04 - Make Transfer ETH",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "05 - Make Transfer ERC20",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "06 - Show UTXOs",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "07 - Merge UTXOs",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "08 - Exit Funds ETH",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "09 - Exit Funds ERC20",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "10 - Inflight Exit",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "11 - Processing Exit",
    script: "",
    code: "",
    readme: "",
  },
  {
    title: "Configuration (.env)",
    script: logConfigs,
    code: "",
    readme: "",
  },
];

// LOG CONFIG
function logConfigs() {
  console.log(config);
}

// MAIN
function app() {
  // app
  const app = document.createElement("div");
  app.classList.add("app");

  const home = document.createElement("div");
  home.classList.add("home");
  app.appendChild(home);

  const sidebar = createSidebar();
  home.appendChild(sidebar);
  createLogBox(home);
  return app;
}

// SIDEBAR
function createSidebar() {
  // sidebar
  const sidebar = document.createElement("div");
  sidebar.classList.add("status");

  // logo
  const sidebarBlock = document.createElement("div");
  const logoImg = document.createElement("img");
  logoImg.classList.add("status_logo");
  logoImg.src =
    "https://webwallet.ropsten.v1.omg.network/static/media/omisego-blue.ff9c1d0f.svg";
  sidebarBlock.appendChild(logoImg);

  const infoBlock = document.createElement("div");
  infoBlock.classList.add("info");

  // appending elements
  sidebar.appendChild(sidebarBlock);
  sidebarBlock.appendChild(infoBlock);

  // adding samples list
  samples.forEach((sample) => {
    const infoItem = document.createElement("div");
    infoItem.classList.add("info_item");
    infoBlock.appendChild(infoItem);

    infoItem.innerText = sample.title;
    infoItem.addEventListener("click", () => onSampleClick(sample));
  });
  return sidebar;
}

// LOG BOX
function createLogBox(home) {
  // block
  const block = document.createElement("div");
  const title = document.createElement("h2");
  const subtitle = document.createElement("div");
  const container = document.createElement("div");

  subtitle.id = "subtitle";

  container.classList.add("block_balances");
  block.classList.add("block");
  subtitle.classList.add("subtitle");

  title.innerText = "OMG-JS Code Samples";
  subtitle.innerText = "Hello OMG!";

  block.appendChild(title);
  title.appendChild(subtitle);
  block.appendChild(container);

  // logBox
  const logBox = document.createElement("pre");
  const logBoxHeader = document.createElement("div");
  const logBoxContent = document.createElement("div");

  logBox.classList.add("block_box");
  logBoxHeader.classList.add("block_header");
  logBoxContent.classList.add("block_row");

  container.appendChild(logBox);
  logBox.appendChild(logBoxHeader);
  logBox.appendChild(logBoxContent);

  logBoxHeader.innerText = "logs";
  logBoxContent.id = "logBox";

  const homeMain = document.createElement("div");
  homeMain.classList.add("home_main");
  homeMain.appendChild(block);
  home.appendChild(homeMain);
}

// BUTTON CLICK
function onSampleClick(sample) {
  const subtitle = document.getElementById("subtitle");
  subtitle.innerText = sample.title;

  const logBox = document.getElementById("logBox");
  logBox.innerHTML = "";

  sample.script();

  console.log = function (message) {
    if (typeof message == "object") {
      logBox.innerHTML +=
        (JSON && JSON.stringify ? JSON.stringify(message, null, 4) : message) +
        "<br/> <br/>";
    } else {
      logBox.innerHTML += message + "<br/> <br/>";
    }
  };
}

document.body.appendChild(app());
