const { assert, expect } = require("chai")
const { network, getNamedAccounts, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const main = () => {
    return developmentChains.includes(network.name)
        ? describe("NftMarketplace", () => {
              let deployer, user, nftContract, nftAddress, nftMarketplaceContract, nftMarketPlace
              const PRICE = ethers.utils.parseEther("0.1")
              const TOKEN_ID = 0

              beforeEach(async () => {
                  const accounts = await ethers.getSigners()
                  user = accounts[1]
                  deployer = (await getNamedAccounts()).deployer
                  await deployments.fixture(["all"])

                  nftContract = await ethers.getContract("BasicNft")
                  nftMarketplaceContract = await ethers.getContract("NftMarketplace")
                  nftMarketPlace = nftMarketplaceContract.connect(user)
                  nftAddress = nftContract.address

                  // Minting and approving the NFT to be listed in the marketplace
                  const mintTx = await nftContract.mintNft()
                  await mintTx.wait(1)
                  await nftContract.approve(nftMarketplaceContract.address, TOKEN_ID)
              })

              describe("listItem", () => {
                  it("should revert if price is 0", async () => {
                      await expect(
                          nftMarketplaceContract.listItem(nftAddress, TOKEN_ID, 0)
                      ).to.be.revertedWithCustomError(
                          nftMarketplaceContract,
                          "NftMarketplace__PriceMustBeAboveZero"
                      )
                  })

                  it.only("NFT is not approved to be listed in the marketplace if the lister is not the owner", async () => {
                      await expect(
                        nftMarketPlace.listItem(nftAddress, TOKEN_ID, PRICE)
                      ).to.be.revertedWithCustomError(
                          nftMarketplaceContract,
                          "NftMarketplace__NotTheOwner"
                      )
                  })

                  it.only("NFT is listed in the marketplace", async () => {
                      const listedTx = await nftMarketplaceContract.listItem(
                          nftAddress,
                          TOKEN_ID,
                          PRICE
                      )
                      const listedTxReceipt = await listedTx.wait(1)
                      const [lister, listedNftAddress, tokenId, nftPrice] = listedTxReceipt.events[0].args;
                      assert.equal(lister, deployer)
                      assert.equal(listedNftAddress, nftAddress)
                      assert.equal(TOKEN_ID, tokenId.toString())
                      assert.equal(ethers.utils.formatEther(nftPrice), 0.1)
                  })
              })

              describe("getListedNft", () => {
                  it("Nft not listed", async () => {
                      const { price } = await nftMarketplaceContract.getListedNft(
                          nftAddress,
                          TOKEN_ID
                      )
                      assert.equal(price.toString(), "0")
                  })
              })
          })
        : describe.skip
}

main()
