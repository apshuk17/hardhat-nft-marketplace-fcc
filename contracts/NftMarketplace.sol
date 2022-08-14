// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__NftAlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NftNotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotTheOwner();
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketplace_NoProceeds();
error NftMarketplace_TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }

    // Nft Address -> Nft Token Id -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    // Seller Address -> Amount Earned from selling the NFT's
    mapping(address => uint256) private s_proceeds;

    event ItemListed(
        address indexed seller,
        address indexed nftaddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCancelled(
        address indexed canceller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    ////////////////
    // Modifiers //
    ///////////////

    modifier alreadyListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__NftAlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace__NotTheOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NftNotListed(nftAddress, tokenId);
        }
        _;
    }

    ////////////////////
    // Main Functions //
    ///////////////////

    /**
     * @notice Method for listing your NFT on the marketplace
     * @param nftAddress - NFT contract address
     * @param tokenId - NFT token Id
     * @param price - sale price of the listed NFT
     * @dev Technically, we have the contract to be the escrow for the NFTs
     * but this way people can still hold their NFT's while listed
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        // Challenge: Have this contract accept payment in subsets of tokens($-Dollars)
        // Use Chainlink price feeds to convert the price of the tokens between each other
        alreadyListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        /**
            Two ways to list the NFT
            1. Send the NFT to the contract. Transfer -> "Contract" hold the NFT
            2. Owners can still hold the NFT, and give the marketplace approval to sell their NFT

            We are goin to use the approach no. 2  
        */
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace();
        }

        s_listings[nftAddress][tokenId] = Listing({price: price, seller: msg.sender});
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // 2. `buyItem`: Buy the NFTs
    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (listedItem.price > msg.value) {
            revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        // We just don't send the money to the seller....?
        // https://fravoll.github.io/solidity-patterns/pull_over_push.html

        // Sending or tranferring the money to the user is not advocated.
        // Let the seller withdraw it

        // Update sellers purse
        s_proceeds[listedItem.seller] += msg.value;

        // Delete the NFT from listing
        delete (s_listings[nftAddress][tokenId]);

        // Transfer the NFT to the buyer
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);

        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    // 3. `cancelItem`: Cancel a listing
    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCancelled(msg.sender, nftAddress, tokenId);
    }

    // 4. `updateListing`: Update price
    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    // 5. `withdrawProceeds`: Withdraw payment for my bought NFTs
    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketplace_NoProceeds();
        }
        // As we learned to avoid any reentrancy issue, state changes will be done before the transfer
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarketplace_TransferFailed();
        }
    }

    //////////////////////
    // Getter Functions //
    /////////////////////

    function getListedNft(address nftAddress, uint256 tokenId)
        public
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) public view returns (uint256) {
        return s_proceeds[seller];
    }
}
