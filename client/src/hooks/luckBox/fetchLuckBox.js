import BigNumber from "bignumber.js"
import { ethers } from "ethers"
import multicall from "../../utils/multicall"
import LuckBoxABI from "../../abi/LuckBox.json"
import ERC721ABI from "../../abi/ERC721.json"
import ERC1155ABI from "../../abi/ERC1155.json"
import axios from "axios"

const fetchLuckBoxes = async (luckBoxesToFetch, rpcServer) => {
  const data = await Promise.all(
    luckBoxesToFetch.map(async (luckBoxConfig) => {
      const { boxAddress } = luckBoxConfig

      const [ticketPrice, resultCount, owner, totalEth, firstQueue, lastQueue] =
        await multicall(LuckBoxABI, [
          {
            address: boxAddress,
            name: "ticketPrice",
          },
          {
            address: boxAddress,
            name: "resultCount",
          },
          {
            address: boxAddress,
            name: "owner",
          },
          {
            address: boxAddress,
            name: "totalEth",
          },
          {
            address: boxAddress,
            name: "firstQueue",
          },
          {
            address: boxAddress,
            name: "lastQueue",
          },
        ], rpcServer)

      const resultData = await Promise.all(
        Array(parseInt(resultCount[0]))
          .fill(0)
          .map(async (_, index) => {
            const calls = [
              {
                address: boxAddress,
                name: "result",
                params: [index],
              },
            ]

            const [result] = await multicall(LuckBoxABI, calls, rpcServer)

            return {
              requestId: result.requestId,
              drawer: result.drawer,
              won: result.won,
              slot: result.slot.toString(),
              output: result.output.toString(),
              eligibleRange: result.eligibleRange.toString(),
            }
          })
      )

      const waitFor = (delay) =>
        new Promise((resolve) => setTimeout(resolve, delay))

      let stackData = []

      if (parseInt(firstQueue[0]) <= parseInt(lastQueue[0])) {
        for (
          let i = parseInt(firstQueue[0]);
          i <= parseInt(lastQueue[0]);
          i++
        ) {
          const [reserveData] = await multicall(LuckBoxABI, [
            {
              address: boxAddress,
              name: "reserveQueue",
              params: [i],
            },
          ], rpcServer)
          if (reserveData.assetAddress !== ethers.constants.AddressZero) {
            const erc721Calls = [
              {
                address: reserveData.assetAddress,
                name: "tokenURI",
                params: [reserveData.tokenId.toString()],
              },
            ]

            const erc1155Calls = [
              {
                address: reserveData.assetAddress,
                name: "uri",
                params: [reserveData.tokenId.toString()],
              },
            ]

            let [tokenURI] = reserveData.is1155
              ? await multicall(ERC1155ABI, erc1155Calls, rpcServer)
              : await multicall(ERC721ABI, erc721Calls, rpcServer)

            tokenURI = reserveData.is1155 ? tokenURI[0] : tokenURI

            let tokenObj

            try {
              // delayed on Pinata cloud
              if (
                tokenURI &&
                tokenURI.toString().indexOf("gateway.pinata.cloud") !== -1
              ) {
                // tokenURI = tokenURI.toString().replace("gateway.pinata.cloud", "ipfs.io")
                await waitFor(100 * i)
              }

              tokenObj = await axios.get(tokenURI)

              // replace pinata node with IPFS node
              if (
                tokenObj &&
                tokenObj.data &&
                tokenObj.data.image &&
                tokenObj.data.image.indexOf("gateway.pinata.cloud") !== -1
              ) {
                tokenObj.data.image = tokenObj.data.image.replace(
                  "gateway.pinata.cloud",
                  "ipfs.io"
                )
              }
            } catch (e) {
              console.log(`failed at index ${i}`)
            }

            stackData.push({
              assetAddress: reserveData.assetAddress,
              is1155: reserveData.is1155,
              randomnessChance: reserveData.randomnessChance.toString(),
              tokenId: reserveData.tokenId.toString(),
              tokenURI: tokenObj && tokenObj.data,
            })
          }
        }
      }

      const data = await Promise.all(
        Array(parseInt(9))
          .fill(0)
          .map(async (_, index) => {
            const calls = [
              {
                address: boxAddress,
                name: "list",
                params: [index],
              },
            ]

            const [nftBox] = await multicall(LuckBoxABI, calls, rpcServer)
            if (nftBox.assetAddress !== ethers.constants.AddressZero) {
              const erc721Calls = [
                {
                  address: nftBox.assetAddress,
                  name: "tokenURI",
                  params: [nftBox.tokenId.toString()],
                },
              ]

              const erc1155Calls = [
                {
                  address: nftBox.assetAddress,
                  name: "uri",
                  params: [nftBox.tokenId.toString()],
                },
              ]

              let [tokenURI] = nftBox.is1155
                ? await multicall(ERC1155ABI, erc1155Calls, rpcServer)
                : await multicall(ERC721ABI, erc721Calls, rpcServer)

              tokenURI = nftBox.is1155 ? tokenURI[0] : tokenURI

              let tokenObj

              try {
                // delayed on Pinata cloud
                if (
                  tokenURI &&
                  tokenURI.toString().indexOf("gateway.pinata.cloud") !== -1
                ) {
                  // tokenURI = tokenURI.toString().replace("gateway.pinata.cloud", "ipfs.io")
                  await waitFor(100 * index)
                }

                if (tokenURI && tokenURI.toString().indexOf("{id}") !== -1) {
                  tokenURI = tokenURI.replace("{id}", `${nftBox.tokenId}`)
                }

                if (tokenURI && tokenURI.toString().indexOf("tamagofinance-nft-metadata-api.vercel.app/api/egg/2") !== -1) {
                  // hard-coded for Tamago Finance NFT
                  tokenObj = {}
                  tokenObj.data =  {"name":"Tamago Finance - #2 Lego Egg","description":"Early Adopters will obtain this exclusive Tamago NFT by joining Tamago’s early user interview, helping Tamago to test out the product.","external_url":"https://tamago.finance/","image":"https://tamago.oss-cn-hongkong.aliyuncs.com/nft/2.png"}
                } else if (tokenURI && tokenURI.toString().indexOf("metadata.cryptoempire.cards/api/avatars") !== -1) {
                  // hard-coded for Crypto Empire
                  tokenObj = {}
                  tokenObj.data = {"name":`AVATAR OF BANCOR THE \"PRODIGY\" #${nftBox.tokenId}`,"description":"CryptoEmpire Avatars are gifts to the early community members and NFT card holders of the CryptoEmpire project. 3,000 avatars, inspired by the CryptoEmpire NFTs, were distributed to select addresses.","external_url":"https://cryptoempire.cards/","image": `https://assets.cryptoempire.cards/avatars/${nftBox.tokenId}.png`}
                } else if (tokenURI && tokenURI.toString().indexOf("https://metadata.maonft.com/api/rpc") !== -1) {
                  // hard-coded for MAO DAO
                  tokenObj = {}
                  let tokenNumber = Number(nftBox.tokenId)
                  if (tokenNumber < 1000) {
                    tokenNumber = `0${tokenNumber}`
                  } else {
                    tokenNumber = `${tokenNumber}`
                  }
                  tokenObj.data = {"name":`Ready Player Cat #${nftBox.tokenId}`,"description":"Ready Player Cat (RPC) is the mascot of the MAO DAO gaming metaverse. They are only born one at a time from loot boxes, and each celebrate distinctive qualities and visual characteristics. RPC Genesis is a curated collection of 5,000 unique RPC NFTs on the Ethereum blockchain that also represent MAO DAO membership.","external_url":"https://maonft.com/rpc/4990","image":`https://asset.maonft.com/rpc/${tokenNumber}.png`,"attributes":[{"trait_type":"ID","value":4990},{"trait_type":"Background","value":"Salt"},{"trait_type":"Cloth","value":"Elton"},{"trait_type":"Eye","value":"Ray Ban"},{"trait_type":"Hair","value":"Afro Hair"}]}
                }
                
                else {
                  tokenObj = await axios.get(tokenURI)
                }

                

                // replace pinata node with IPFS node
                if (
                  tokenObj &&
                  tokenObj.data &&
                  tokenObj.data.image &&
                  tokenObj.data.image.indexOf("gateway.pinata.cloud") !== -1
                ) {
                  tokenObj.data.image = tokenObj.data.image.replace(
                    "gateway.pinata.cloud",
                    "ipfs.io"
                  )
                }
              } catch (e) {
                console.log(`failed at index ${index}`)
              }

              return {
                assetAddress: nftBox.assetAddress,
                is1155: nftBox.is1155,
                locked: nftBox.locked,
                pendingWinnerToClaim: nftBox.pendingWinnerToClaim,
                randomnessChance: nftBox.randomnessChance.toString(),
                tokenId: nftBox.tokenId.toString(),
                winner: nftBox.winner,
                tokenURI: tokenObj && tokenObj.data,
              }
            }

            return {
              assetAddress: nftBox.assetAddress,
              is1155: nftBox.is1155,
              locked: nftBox.locked,
              pendingWinnerToClaim: nftBox.pendingWinnerToClaim,
              randomnessChance: nftBox.randomnessChance.toString(),
              tokenId: nftBox.tokenId.toString(),
              winner: nftBox.winner,
              tokenURI: "",
            }
          })
      )

      return {
        ...luckBoxConfig,
        nftList: data,
        ticketPrice: ethers.utils.formatEther(ticketPrice[0]._hex),
        resultData: resultData.reverse(),
        owner: owner[0],
        totalEth: ethers.utils.formatEther(totalEth[0]._hex),
        reserveData: stackData,
      }
    })
  )
  return data
}

export default fetchLuckBoxes
