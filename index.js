const { ethers } = require("ethers");

const WEBSOCKET_ENDPOINT =
    "wss://eth-goerli.g.alchemy.com/v2/cLlJg81fhAwF1Q4ZewNi6h3H4Euk05gv";

const TX_DATA_TOKEN = "Calcel Transaction";
var TX_DATA_HASHED = "" // originally empty string

var TARGET_ADDRESS = ""
const TARGET_PRIVATEKEY = ""

const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_ENDPOINT)
const fromWallet = new ethers.Wallet(TARGET_PRIVATEKEY)
const fromSigner = fromWallet.connect(provider)

async function init() {

    TARGET_ADDRESS = await fromWallet.getAddress()
    TX_DATA_HASHED = ethers.utils.hashMessage(TX_DATA_TOKEN)

    provider.on('pending', tx => {
        provider.getTransaction(tx).then(transaction => {
            
            console.log("Monitoring... :)")

            if(transaction.from === TARGET_ADDRESS && transaction.data !== TX_DATA_HASHED) {
                
                console.log(transaction)

                const nonce = transaction.nonce;
                const gasPriceValue = parseInt(transaction.gasPrice['_hex'], 16)

                provider.getBlock('latest').then(block => {
                    fromSigner.sendTransaction({
                        from: TARGET_ADDRESS,
                        to: TARGET_ADDRESS,
                        value: 0,
                        nonce: nonce,
                        data: TX_DATA_HASHED,
                        gasLimit: block.gasLimit,
                        gasPrice: ethers.BigNumber.from( Math.round(gasPriceValue + (gasPriceValue / 10)))
                    }).then(txRes => {
                        console.log(txRes)
                    }).catch(e => {
                        console.warn(e)
                    })
                }).catch(e => {
                    console.warn(e)
                })
            }
        })
    })

    provider._websocket.on('error', (error) => {
        console.log(error)
        console.log("Error detected in websocket. script will restart soon")
        provider._websocket.terminate()
        setTimeout(init, 3000)
    })

    provider._websocket.on('close', (error) => {
        console.log(error)
        console.log("Error detected in websocket. script will restart soon")
        provider._websocket.terminate()
        setTimeout(init, 3000)
    })

    provider.on('error', () => {
        console.log("Error detected in provider")
        setTimeout(init, 3000)
    })
}

init()