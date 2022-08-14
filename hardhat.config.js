require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config()

const RINKEBY_RPC_URL =
    process.env.RINKEBY_RPC_URL !== undefined
        ? process.env.RINKEBY_RPC_URL?.toString()?.trim()
        : ""
const RINKEBY_PRIVATE_KEY =
    process.env.RINKEBY_PRIVATE_KEY !== undefined ? [process.env.RINKEBY_PRIVATE_KEY] : []
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const REPORT_GAS = process.env.REPORT_GAS || false

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        rinkeby: {
            chainId: 4,
            blockConfirmations: 6,
            url: RINKEBY_RPC_URL,
            accounts: RINKEBY_PRIVATE_KEY,
        },
    },
    solidity: {
        compilers: [{ version: "0.8.7" }],
    },
    namedAccounts: {
        deployer: {
            default: 0,
            4: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            rinkeby: ETHERSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    // contractSizer: {
    //     runOnCompile: false,
    //     only: ["Raffle"],
    // },
    mocha: {
        timeout: 500000, // 500 seconds max
    },
}
