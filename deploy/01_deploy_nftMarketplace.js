const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // let nftContract, nftAddress;

    // if (developmentChains.includes(network.name)) {
    //     nftContract = await ethers.getContract("BasicNft", deployer);
    //     nftAddress = nftContract.address;
    // }

    let args = []

    log("---------Deploying NftMarketplace-------------")

    const nftMarketPlace = await deploy("NftMarketplace", {
        from: deployer,
        log: true,
        args,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("-----------Verifying------------")
        await verify(nftMarketPlace.address, args)
    }

    log("-----------------------------------------")
}

module.exports.tags = ["all", "nftmarketplace"]
