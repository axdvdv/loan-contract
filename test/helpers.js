// signs message in node (ganache auto-applies "Ethereum Signed Message" prefix)
async function signMessage(signer, messageHex = '0x') {
    return fixSignature(await web3.eth.sign(messageHex, signer));
};

function fixSignature(signature) {
    // in geth its always 27/28, in ganache its 0/1. Change to 27/28 to prevent
    // signature malleability if version is 0/1
    // see https://github.com/ethereum/go-ethereum/blob/v1.8.23/internal/ethapi/api.go#L465
    let v = parseInt(signature.slice(130, 132), 16);
    if (v < 27) {
        v += 27;
    }
    const vHex = v.toString(16);
    return signature.slice(0, 130) + vHex;
}

function LoanToObject(loan) {
    const amount = loan[0].toString()
    const receiver = loan[1]
    const ttl = loan[2].toString()
    let status = loan[3].toString()
    switch (status) {
        case '0':
            status = 'Empty'
            break
        case '1':
            status = 'Created'
            break
        case '2':
            status = 'Approved'
            break
        case '3':
            status = 'Canceled'
            break
        case '4':
            status = 'Refused'
            break
        case '5':
            status = 'Completed'
            break
        default: {
            throw new Error('invalid status')
        }
    }

    return {
        amount,
        receiver,
        ttl,
        status
    }
}

module.exports = {
    signMessage,
    LoanToObject
};