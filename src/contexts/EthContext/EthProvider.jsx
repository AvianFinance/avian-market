import React, { useReducer, useCallback, useEffect } from "react";
import Web3 from "web3";
import EthContext from "./EthContext";
import { reducer, actions, initialState } from "./state";

function EthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const RIME_TOKEN_CONTRACT_ADDRESS = "0x4909493F604AB882327ca880ad5B330e2B3C43C1"; // Rime token contract address
  const RIME_RENT_CONTRACT_ADDRESS = "0xA5e80F4980878b7C2c23D6fA002358A47d0060a3"; // Rime Rent contract address
  const MARKETPLACE_CONTRACT_ADDRESS = "0xC2AA1764dcf714DEbf762b95aBBaDE411eD35B2c"; // Marketplace contract address

  const init = useCallback(
    async artifacts => {
      if (artifacts) {
        const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
        const accounts = await web3.eth.requestAccounts();
        const networkID = await web3.eth.net.getId();
        let contracts = {};
        try {

          for (const [contractName, artifact] of Object.entries(artifacts)) {
            if(contractName === "Marketplace") {
              const contract1 = new web3.eth.Contract(artifact.abi, MARKETPLACE_CONTRACT_ADDRESS);
              contracts[contractName] = contract1;
            }
            if(contractName === "RimeToken") {
              const contract2 = new web3.eth.Contract(artifact.abi, RIME_TOKEN_CONTRACT_ADDRESS);
              contracts[contractName] = contract2;
            }
            if(contractName === "RimeRent") {
              const contract3 = new web3.eth.Contract(artifact.abi, RIME_RENT_CONTRACT_ADDRESS);
              contracts[contractName] = contract3;
            }
          }
          // console.log(contracts)
        } catch (err) {
          contracts = null;
          console.error(err);
        }
        dispatch({
          type: actions.init,
          data: { artifacts, web3, accounts, networkID, contracts }
        });
      }
    }, []);

  useEffect(() => {
    const tryInit = () => {
      try {
        const artifacts = {
          Marketplace: require("../../contracts/Marketplace.json"),
          RimeToken: require("../../contracts/RimeToken.json"),
          RimeRent: require("../../contracts/RimeRent.json")
        };
        init(artifacts);
      } catch (err) {
        console.error(err);
      }
    };

    tryInit();
  }, [init]);

  useEffect(() => {
    const events = ["chainChanged", "accountsChanged"];
    const handleChange = () => {
      init(state.artifacts);
    };

    events.forEach(e => window.ethereum.on(e, handleChange));
    return () => {
      events.forEach(e => window.ethereum.removeListener(e, handleChange));
    };
  }, [init, state.artifacts]);

  return (
    <EthContext.Provider value={{
      state,
      dispatch
    }}>
      {children}
    </EthContext.Provider>
  );
}

export default EthProvider;
