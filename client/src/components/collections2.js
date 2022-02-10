import React, { useCallback, useContext, useState, useRef } from "react"
import styled from "styled-components"
import { useWeb3React } from "@web3-react/core"
import { Row, Col, Alert } from "reactstrap"
import { FactoryContext } from "../hooks/useFactoryData"
import collections from "../data/collections.json"
import { shortAddress } from "../helper"

const StyledRow = styled(Row)`
    margin-top: 20px;
    margin-bottom: 40px;
`

const Title = styled.h1` 
`

const Switcher = styled(
    ({ className }) => {

        const { currentNetwork, updateNetwork } = useContext(FactoryContext)

        return (
            <div className={className}>
                {/* <div onClick={() => setFilter(0)} className={ currentFilter === 0 && "active" }>
                    ALL
                </div> */}
                <div onClick={() => updateNetwork("mainnet")} className={currentNetwork === "mainnet" && "active"}>
                    MAINNET
                </div>
                <div onClick={() => updateNetwork("polygon")} className={currentNetwork === "polygon" && "active"}>
                    POLYGON
                </div>
            </div>
        )
    })`
    
    display: flex;
    flex-direction: row;
    margin-top :10px;
    margin-bottom: 10px;

    >div {
        cursor: pointer;
        border: 1px solid white;
        padding: 20px; 
        font-size: 24px;
        :not(:first-child) {
            margin-left: 10px;
        }
        :hover {
            background: white;
            color: #0b081b;
        }
    }

    >.active {
        background: white;
            color: #0b081b;
    }

    @media only screen and (max-width: 600px) {
       >div {
           font-size: 20px;
           padding: 10px;
       }
    }



`

const LoadingText = styled(
    ({ className }) => (<div className={className}><div>Loading...</div></div>))`
    font-size : 30px;
    height: 200px;
    display: flex;

    >div{
        margin: auto;
    }

    `

const MainnetDiscliamer = styled(
    ({ className }) => (<div className={className}><Alert color="info">The collection on Mainnet is being prepared, please stay tuned!</Alert></div>))`
    font-size : 22px;

    >div{
        margin: auto;
    }

    .alert {
        padding: 5px 20px 5px 20px;
    }

    `

const Boxes = styled.div`

`

const Box = styled.div`
    display: flex;
    flex-direction: row;

    margin-top: 20px;
    margin-bottom: 20px;

    width: 100%;
    min-height: 200px;

`

const BoxHeader = styled(
    ({ className, index, item, setLuckBoxSelected }) => {

        const COLORS = ["#1565C0", "#373B44", "#4286f4", "#8E2DE2"]

        const color = COLORS[index % COLORS.length]

        if (!item) {
            return null
        }

        return (
            <div className={className}>
                <div onClick={() => setLuckBoxSelected(item)} style={{ background: color }}>
                    <div className="title">
                        #{index + 1}{` `}{item.name}
                    </div>
                    {/* <div className="data">
                        <div>
                            NFTs Worth Of<br/> $72,000
                        </div>
                    </div> */}
                    <div className="next">
                        {`>>>`}
                    </div>
                </div>
            </div>
        )
    })`
   
    flex: 1;
    

    >div { 
        border-radius: 15px;
        padding: 20px 10px 20px 10px;
        height: 100%;
        position: relative;

        >.next {
            font-size: 36px;
            position: absolute;
            bottom: 5px;
            right: 20px;
        }

        >.title {
            font-size: 32px;
            position: absolute;
            left: 20px;
            top: 10px;
        }

        >.data {
            top: 0px;
            left: 0px;
            height: 100%;
            width: 100%;
            position: absolute;
            display: flex;
            
            >div {
                font-size: 24px;
                margin: auto;
                text-align: center;
                line-height: 28px;
            }

        }

        cursor: pointer;
        :hover {
            opacity: 0.8;
        }

    }

    @media only screen and (max-width: 600px) {
        
        >div {
            
            >.next {
                font-size: 24px;
            }
    
            >.title {
                font-size: 32px;
                line-height: 30px;
                left: 10px;

            }
        }

    }

    `

const BoxBody = styled(
    ({ className, odd, item }) => {

        if (!item) {
            return null
        }

        const collection = collections.find(col => item.boxAddress === col.address)

        return (
            <div className={className}>
                <div className={odd ? "odd" : "even"}>
                    <div>
                        <b>Collection Info:</b>
                        <p>
                            {collection && collection.description || ""}
                        </p>
                        <b>Creator Address:</b>{` `}<a href={`https://polygonscan.com/address/${item.owner}`} target="_blank">{(item && item.owner) ? shortAddress(item.owner, 7, -5) : ""}</a>
                        <br />
                        <b>Ticket Price:</b>{` `}{item.ticketPrice || "0"}{` `}MATIC
                    </div>
                    <div>
                        {item.nftList.length > 0 && item.nftList.map((nft, index) => {
                            if (index > 3) return null
    
                            let imageUrl

                            if (nft && nft.tokenURI && nft.tokenURI.image_url) {
                                imageUrl = nft.tokenURI.image_url
                            } else if (nft && nft.tokenURI && nft.tokenURI.image) {
                                imageUrl = nft.tokenURI.image
                            }

                            return (
                                <div className="image-box" key={index}>
                                    <img src={imageUrl} alt="image" />
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        )
    })`
    flex: 2;

    >div {
        border: 1px solid white;
        border-radius: 15px;
        height: 100%;
        padding: 20px 10px 20px 10px;
        font-size: 20px;
        line-height: 22px;

        a {
            color: inherit;
            text-decoration: none;
            :hover {
                text-decoration: underline;
            }
        }
        
        display: flex;

        >div {
            flex: 1;
            padding-left: 10px;
            padding-right: 10px;

            :last-child {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
            }

            .image-box {
                border: 1px solid white;
                border-radius: 8px;
                margin-right: 8px;
                margin-bottom: 8px;
                width: 70px;
                height: 70px;
                overflow: hidden;

                >img {
                    width: 100%;
                }

            }

        }

    }

    >.odd {
        margin-left: 10px;
    }

    >.even {
        margin-right: 10px;
    }


    @media only screen and (max-width: 600px) {
        >div {
            >div {
                font-size: 18px;
                line-height: 20px;
                padding-left: 0px;
                padding-right: 0px;
                flex: 2;

                :last-child {
                    flex: 1;
                    display: inline-block;
                }

                .image-box {
                    border-radius: 8px;
                    margin-right: 4px;
                    margin-bottom: 4px;
                    
                }
            }
        }
    }
    

        `

const Collection2 = ({
    setLuckBoxSelected,
    toggleCreateLuckBox
}) => {

    const { allBoxesDetail, currentNetwork } = useContext(FactoryContext)

    const boxes = allBoxesDetail

    return (
        <StyledRow>
            <Title>
                Collections
            </Title>

            <Switcher />

            {currentNetwork === "mainnet" && <MainnetDiscliamer />}

            {/* when loading */}
            {!allBoxesDetail && (<LoadingText />)}

            {allBoxesDetail && (
                <Boxes>
                    {boxes.map((item, index) => {

                        const odd = index % 2 === 0

                        return (
                            <Box key={index}>
                                {odd
                                    ?
                                    <><BoxHeader setLuckBoxSelected={setLuckBoxSelected} item={item} index={index} /><BoxBody item={item} odd={odd} /></>
                                    :
                                    <><BoxBody item={item} odd={odd} /><BoxHeader setLuckBoxSelected={setLuckBoxSelected} item={item} index={index} /></>
                                }
                            </Box>
                        )
                    })}
                </Boxes>
            )

            }

        </StyledRow>
    )
}

export default Collection2