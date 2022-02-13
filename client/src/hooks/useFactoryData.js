import React, {
  useMemo,
  createContext,
  useState,
  useEffect,
  useCallback,
  useReducer
} from "react"
import { useWeb3React } from "@web3-react/core"
import BigNumber from "bignumber.js"
import fetchFactory from "./factory/fetchFactory"
import fetchLuckBox from "./luckBox/fetchLuckBox"
import { FACTORY_POLYGON, FACTORY_MAINNET, POLYGON_RPC_SERVER, MAINNET_RPC_SERVER } from "../constants"
import useInterval from "./useInterval"

export const FactoryContext = createContext({})

const Provider = ({ children }) => {

  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "UPDATE_NETWORK":
          return {
            ...prevState,
            currentNetwork: action.data,
          }
        default:
          return {
            ...prevState,
          }
      }
    },
    {
      currentNetwork: "mainnet"
    }
  )

  const { currentNetwork } = state

  const { account, library } = useWeb3React()
  const [factoryDetail, setFactoryDetail] = useState()
  const [allBoxesDetail, setAllBoxesDetail] = useState()
  const [tick, setTick] = useState(0)

  const [delay, setDelay] = useState(10000)

  const increaseTick = useCallback(() => {
    setTick(tick + 1)
  }, [tick])

  useInterval(
    () => {
      increaseTick()
    },
    10000
  )

  const FACTORY_ADDRESS = currentNetwork === "mainnet" ? FACTORY_MAINNET : FACTORY_POLYGON
  const RPC_SERVER = currentNetwork === "mainnet" ? MAINNET_RPC_SERVER : POLYGON_RPC_SERVER

  const getFactory = useCallback(async () => {

    try {

      const data = await fetchFactory(FACTORY_ADDRESS, RPC_SERVER)
      console.log("data -->", data)
      setFactoryDetail(data)

    } catch (e) {

      console.log(e)

      setFactoryDetail()
      setAllBoxesDetail()

    }

  }, [FACTORY_ADDRESS, RPC_SERVER ])

  const getAllBoxesDetail = useCallback(async () => {

    try {
      const data = await fetchLuckBox(factoryDetail, RPC_SERVER)

      setAllBoxesDetail(data)
    } catch (e) {
      console.log(e)

    }

  },[factoryDetail, RPC_SERVER])

  useEffect(() => {
    if (!factoryDetail) return
    getAllBoxesDetail()
  }, [factoryDetail, tick])

  useEffect(() => {
    getFactory()
  }, [account, currentNetwork])

  const factoryContext = useMemo(
    () => ({
      factoryDetail,
      allBoxesDetail,
      increaseTick,
      tick,
      currentNetwork,
      updateNetwork: (network) => {
        dispatch({ type: "UPDATE_NETWORK", data: network })
      }
    }),
    [factoryDetail, allBoxesDetail, increaseTick, currentNetwork]
  )

  return (
    <FactoryContext.Provider value={factoryContext}>
      {children}
    </FactoryContext.Provider>
  )
}

export default Provider
