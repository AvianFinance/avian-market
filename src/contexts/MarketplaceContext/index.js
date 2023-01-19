import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useEth } from "../EthContext";
// import { useInfura } from "../InfuraContext";
import { getIpfsGatewayUri } from "../../utils";
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const MarketplaceContext = createContext();

function MarketplaceProvider({ children }) {
  const [listings, setListings] = useState(null);
  const [listingsTransformed, setListingsTransformed] = useState(null);
  const [sellListings, setSellListings] = useState(null);
  const [sellListingsTransformed, setSellListingsTransformed] = useState(null);
  const [ownedTokens, setOwnedTokens] = useState(null);
  const { web3, artifacts, contracts, accounts } = useEth().state;
  const {
    // Marketplace: marketplaceContract,
    AvianMarket: marketplaceContract,
    RimeToken: rimeTokenContract,
    RimeRent: rimeRentContract
  } = contracts || {};
  // const infura = useInfura();

  //Getting the rentable NFTS listed in Market
  const updateListings = useCallback(
    async () => {
      if (marketplaceContract) {

        const res = await marketplaceContract.methods.getRentListings().call();

        const listingsExtendedTransformed = {};
        console.log("Retriving tokens in rental market")
        console.log(res)
        const listingsExtended = await Promise.all(
          res.map(async listing => {
            const {
              nftContract: nftContractAddress,
              pricePerDay: pricePerDayStr,
              startDateUNIX: startDateUnixStr,
              endDateUNIX: endDateUnixStr,
              expires: expiresStr,
              tokenId,
              owner,
              user
            } = listing;
            const nftContract = new web3.eth.Contract(
              artifacts.RimeRent.abi, nftContractAddress
            );
            const tokenUri = await nftContract.methods.tokenURI(tokenId).call();
            let tokenUriRes;
            try {
              // tokenUriRes = await (await fetch(getIpfsGatewayUri(tokenUri))).json();
             tokenUriRes = await (await fetch(tokenUri)).json();
            } catch (err) {
              console.error("Bad uri");
            }
            // const noUser = parseInt(user) !== 0;
            const pricePerDay = parseInt(pricePerDayStr);
            const startDateUnix = parseInt(startDateUnixStr);
            const endDateUnix = parseInt(endDateUnixStr);
            const duration = endDateUnix - startDateUnix;
            const expires = parseInt(expiresStr);
            const isOwner = owner === accounts[0];
            const isUser = user === accounts[0];
            const transformedData = {
              pricePerDay,
              startDateUnix,
              endDateUnix,
              duration,
              expires,
              user
            };
            const listingExtended = {
              ...listing,
              ...transformedData,
              nftContractAddress,
              tokenUri,
              tokenUriRes,
              isOwner,
              isUser
            };
            [
              ...Array(8).keys(),
              "nftContract",
              "startDateUNIX",
              "endDateUNIX",
            ].forEach(i => void delete listingExtended[i]);

            if (listingsExtendedTransformed[nftContractAddress]) {
              listingsExtendedTransformed[nftContractAddress][tokenId] = transformedData;
            } else {
              listingsExtendedTransformed[nftContractAddress] = { [tokenId]: transformedData };
            }

            return listingExtended;
          })
        );

        setListings(listingsExtended);
        setListingsTransformed(listingsExtendedTransformed);
      }
    },
    [
      marketplaceContract,
      web3?.eth.Contract,
      artifacts?.RimeRent.abi,
      accounts
    ]);

  useEffect(() => void updateListings(), [updateListings]);


  //Getting the rentable NFTS listed in Market
  // const updateOwnedTokens = useCallback(
  //   async () => {
      // await Moralis.start({
      //   apiKey: "7vrliQAzsM0MKcL8wHIQMPAGnUGzWTLwxWYPoyHciUGeRR2z1vlwbxw3oX3NpGsd",
      //   // ...and any other configuration
      // });
    
      // const address = "0x74905182979646CD342F2d9F4af04e751683c80e";
    
      // const chain = EvmChain.FUJI;
    
      // const response = await Moralis.EvmApi.nft.getWalletNFTs({
      //    address,
      //    chain,
      // });
      // console.log(response.toJSON());

      
  //   },
  //   []);

  //   useEffect(() => void updateOwnedTokens(), [updateOwnedTokens]);

 const updateOwnedTokens = useCallback(
    async () => {
        // This is useful when using local network (ganache) or network otherwise unsupported
        // docs.infura.io/infura/infura-custom-apis/nft-sdk/supported-networks
        console.log("Retriving my owned tokens")
        if (rimeRentContract && listingsTransformed) {
          await Moralis.start({
            apiKey: "7vrliQAzsM0MKcL8wHIQMPAGnUGzWTLwxWYPoyHciUGeRR2z1vlwbxw3oX3NpGsd",
            // ...and any other configuration
          });
        
          const address = accounts[0];
        
          const chain = EvmChain.FUJI;
        
          const response = await Moralis.EvmApi.nft.getWalletNFTs({
             address,
             chain,
          });
          console.log("Response")
          console.log(response)
          const tokens = response.jsonResponse.result
          console.log(tokens);
          // const res = await marketplaceContract.methods.isRentableNFT(tokens[1]["token_address"]).call();
          // console.log(res)

          // for (const item of tokens) {
          //   let nftContractAddress = item.token_address
          //   const isRentable = await marketplaceContract.methods.isRentableNFT(nftContractAddress).call();
          //   if(isRentable){

          //   }
          // }
          const mytokens = await Promise.all(
            tokens.filter(async token => {
              let nftContractAddress = token.token_address
              const isRentable = await marketplaceContract.methods.isRentableNFT(nftContractAddress).call(); 
              if (isRentable){return true}
              else{return false}
            }).map(async token => {
                let tokenUriRes;
                let nftContractAddress = token.token_address
                let tokenId = token.token_id
                let tokenUri = token.token_uri
                try {
                  tokenUriRes = await (await fetch(tokenUri)).json();
                } catch (err) {
                  console.error("Bad uri");
                }
                return {
                  nftContractAddress,
                  tokenId,
                  tokenUri,
                  tokenUriRes,
                  listingData: listingsTransformed[nftContractAddress]?.[tokenId]
                };
              }
            )
          );

          // const mytokens = await Promise.all(
          //   tokens.map(async token => {
          //     let nftContractAddress = token.token_address
          //     const isRentable = await marketplaceContract.methods.isRentableNFT(nftContractAddress).call();                                        
          //     if (isRentable){
          //       let tokenUriRes;
          //       let tokenId = token.token_id
          //       let tokenUri = token.token_uri
          //       try {
          //         tokenUriRes = await (await fetch(tokenUri)).json();
          //       } catch (err) {
          //         console.error("Bad uri");
          //       }
          //       return {
          //         nftContractAddress,
          //         tokenId,
          //         tokenUri,
          //         tokenUriRes,
          //         listingData: listingsTransformed[nftContractAddress]?.[tokenId]
          //       };
          //     }
          //   })
          // );
          // const { address: nftContractAddress } = rimeRentContract.options;
          // // This only checks `rimeRentContract`. 
          // console.log("HI")
          // const mintEvents = await rimeRentContract.getPastEvents("Transfer", {
          //   filter: {
          //     from: "0x0000000000000000000000000000000000000000",
          //     to: accounts[0]
          //   },
          //   fromBlock: 0
          // });
          // console.log("Mint Events")
          // console.log(mintEvents)
          // const tokens = await Promise.all(
          //   mintEvents.map(async mintEvent => {
          //     const { tokenId } = mintEvent.returnValues;
          //     const tokenUri = await rimeRentContract.methods.tokenURI(tokenId).call();
          //     let tokenUriRes;
          //     try {
          //       //tokenUriRes = await (await fetch(getIpfsGatewayUri(tokenUri))).json();
          //       tokenUriRes = await (await fetch(tokenUri)).json();
          //     } catch (err) {
          //       console.error("Bad uri");
          //     }
          //     return {
          //       nftContractAddress,
          //       tokenId,
          //       tokenUri,
          //       tokenUriRes,
          //       listingData: listingsTransformed[nftContractAddress]?.[tokenId]
          //     };
          //   })
          // );
          console.log("mytokens")
          console.log(mytokens)
          setOwnedTokens(mytokens);
        }
    },
    [
      rimeRentContract,
      listingsTransformed,
      accounts
    ]);

  // useEffect(() => void updateOwnedTokens(), [updateOwnedTokens]);

  // const updateOwnedTokens = useCallback(
  //   async () => {
  //       // This is useful when using local network (ganache) or network otherwise unsupported
  //       // docs.infura.io/infura/infura-custom-apis/nft-sdk/supported-networks
  //       console.log("Retriving my owned tokens")
  //       if (rimeRentContract && listingsTransformed) {
  //         const { address: nftContractAddress } = rimeRentContract.options;
  //         // This only checks `rimeRentContract`. 
  //         console.log("HI")
  //         const mintEvents = await rimeRentContract.getPastEvents("Transfer", {
  //           filter: {
  //             from: "0x0000000000000000000000000000000000000000",
  //             to: accounts[0]
  //           },
  //           fromBlock: 0
  //         });
  //         console.log("Mint Events")
  //         console.log(mintEvents)
  //         const tokens = await Promise.all(
  //           mintEvents.map(async mintEvent => {
  //             const { tokenId } = mintEvent.returnValues;
  //             const tokenUri = await rimeRentContract.methods.tokenURI(tokenId).call();
  //             let tokenUriRes;
  //             try {
  //               //tokenUriRes = await (await fetch(getIpfsGatewayUri(tokenUri))).json();
  //               tokenUriRes = await (await fetch(tokenUri)).json();
  //             } catch (err) {
  //               console.error("Bad uri");
  //             }
  //             return {
  //               nftContractAddress,
  //               tokenId,
  //               tokenUri,
  //               tokenUriRes,
  //               listingData: listingsTransformed[nftContractAddress]?.[tokenId]
  //             };
  //           })
  //         );
  //         console.log(tokens)
  //         setOwnedTokens(tokens);
  //       }
  //   },
  //   [
  //     rimeRentContract,
  //     listingsTransformed,
  //     accounts
  //   ]);

  // useEffect(() => void updateOwnedTokens(), [updateOwnedTokens]);

   //Getting the Selling NFTS listed in Market
  // const updateSellListings = useCallback(
  //   async () => {
  //     if (marketplaceContract) {

  //       const res = await marketplaceContract.methods.getSellListings().call();

  //       const sellListingsExtendedTransformed = {};
  //       console.log("Retriving NFTs to sell")
  //       console.log(res)
  //       const sellListingsExtended = await Promise.all(
  //         res.map(async listing => {
  //           const {
  //             nftContract: nftContractAddress,
  //             pricePerDay: pricePerDayStr,
  //             startDateUNIX: startDateUnixStr,
  //             endDateUNIX: endDateUnixStr,
  //             expires: expiresStr,
  //             tokenId,
  //             owner,
  //             user
  //           } = listing;
  //           const nftContract = new web3.eth.Contract(
  //             artifacts.RimeRent.abi, nftContractAddress
  //           );
  //           const tokenUri = await nftContract.methods.tokenURI(tokenId).call();
  //           let tokenUriRes;
  //           try {
  //             // tokenUriRes = await (await fetch(getIpfsGatewayUri(tokenUri))).json();
  //            tokenUriRes = await (await fetch(tokenUri)).json();
  //           } catch (err) {
  //             console.error("Bad uri");
  //           }
  //           // const noUser = parseInt(user) !== 0;
  //           const pricePerDay = parseInt(pricePerDayStr);
  //           const startDateUnix = parseInt(startDateUnixStr);
  //           const endDateUnix = parseInt(endDateUnixStr);
  //           const duration = endDateUnix - startDateUnix;
  //           const expires = parseInt(expiresStr);
  //           const isOwner = owner === accounts[0];
  //           const isUser = user === accounts[0];
  //           const transformedData = {
  //             pricePerDay,
  //             startDateUnix,
  //             endDateUnix,
  //             duration,
  //             expires,
  //             user
  //           };
  //           const listingExtended = {
  //             ...listing,
  //             ...transformedData,
  //             nftContractAddress,
  //             tokenUri,
  //             tokenUriRes,
  //             isOwner,
  //             isUser
  //           };
  //           [
  //             ...Array(8).keys(),
  //             "nftContract",
  //             "startDateUNIX",
  //             "endDateUNIX",
  //           ].forEach(i => void delete listingExtended[i]);

  //           if (listingsExtendedTransformed[nftContractAddress]) {
  //             listingsExtendedTransformed[nftContractAddress][tokenId] = transformedData;
  //           } else {
  //             listingsExtendedTransformed[nftContractAddress] = { [tokenId]: transformedData };
  //           }

  //           return listingExtended;
  //         })
  //       );

  //       setListings(listingsExtended);
  //       setListingsTransformed(listingsExtendedTransformed);
  //     }
  //   },
  //   [
  //     marketplaceContract,
  //     web3?.eth.Contract,
  //     artifacts?.RimeRent.abi,
  //     accounts
  //   ]);

  // useEffect(() => void updateSellListings(), [updateSellListings]);

  // const mint = async (tokenUri) => {
  //   const tx = await rimeRentContract.methods.mint(tokenUri).send({ from: accounts[0] });
  //   if (tx.status) await updateOwnedTokens();
  // };

  // const list = async (nftContractAddress, tokenId, price, duration) => {
  //   // Time values are in seconds
  //   const buffer = 30;
  //   const start = Math.ceil(Date.now() / 1000) + buffer;
  //   const end = start + duration;
  //   const listingFee = await marketplaceContract.methods.getListingFee().call();
  //   const tx = await marketplaceContract.methods.listNFT(
  //     nftContractAddress,
  //     tokenId,
  //     price,
  //     start,
  //     end
  //   ).send({
  //     from: accounts[0],
  //     value: listingFee
  //   });
  //   if (tx.status) await updateListings();
  // };

  // const unlist = async (nftContractAddress, tokenId) => {
  //   const nftContract = new web3.eth.Contract(
  //     artifacts.RentableNft.abi, nftContractAddress
  //   );
  //   const expires = parseInt(await nftContract.methods.userExpires(tokenId).call());
  //   const { pricePerDay } = listingsTransformed[nftContractAddress][tokenId];
  //   const refund = Math.ceil((expires - Date.now() / 1000) / 60 / 60 / 24 + 1) * pricePerDay;
  //   const options = { from: accounts[0], value: Math.max(0, refund) };
  //   const tx = await marketplaceContract.methods.unlistNFT(nftContractAddress, tokenId).send(options);
  //   if (tx.status) await updateListings();
  // };

  const rent = async (nftContractAddress, tokenId, duration) => {
    console.log(listingsTransformed)
    const { pricePerDay } = listingsTransformed[nftContractAddress][tokenId];
    // const now = Math.ceil(Date.now() / 1000);
    // const expires = now + duration;
    // const numDays = (expires - now) / 60 / 60 / 24 + 1;
    const fee = Math.ceil(duration * pricePerDay);
    const options = { from: accounts[0], value: fee };
    const tx = await marketplaceContract.methods.rentNFT(nftContractAddress, tokenId, duration).send(options);
    if (tx.status) await updateListings();
  };

  // console.debug({ listings, listingsTransformed, ownedTokens });
  console.debug({ listings, listingsTransformed});

  return (
    <MarketplaceContext.Provider value={{
      listings: listings || [],
      // ownedTokens: ownedTokens || [],
      // mint,
      // list,
      // unlist,
      rent
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

const useMarketplace = () => useContext(MarketplaceContext);

export { MarketplaceProvider, useMarketplace };
