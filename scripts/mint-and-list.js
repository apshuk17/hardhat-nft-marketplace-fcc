const { ethers } = require("hardhat");

const mintAndList = async () => {
    const nftContract = await ethers.getContract("BasicNft")
    const nftMarketplaceContract = await ethers.getContract("NftMarketplace")
    const NFT_PRICE = ethers.utils.parseEther("0.1")

    console.log("---------Minting NFT--------")
    const mintTx = await nftContract.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId

    console.log("----------Approving NFT-----------")
    const approveTx = await nftContract.approve(nftMarketplaceContract.address, tokenId)
    await approveTx.wait(1)

    console.log("-----------Listing NFT------------");
    const listingTx = await nftMarketplaceContract.listItem(nftContract.address, tokenId, NFT_PRICE)
    const listingTxReceipt = await listingTx.wait(1);

    const lister = listingTxReceipt.events[0].args.seller;
    console.log("Lister", lister)
}

;(async () => {
    try {
        await mintAndList()
        process.exit(0)
    } catch (err) {
        console.log("##Error", err)
        process.exit(1)
    }
})()
