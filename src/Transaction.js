const { sha256 } = require('../utils');

function Transaction(from, to, value, fee, senderPubKey, data, senderSignature, minedInBlockIndex, transferSuccessful = false) {
    let dateCreated = null;
    let transactionDataHash = null;
    class SingleTransaction {
        constructor() {
            dateCreated = new Date().toISOString();

            transactionDataHash = sha256(JSON.stringify({
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
            }));
        }

        getData() {
            return {
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
                transactionDataHash,
                senderSignature,
                minedInBlockIndex,
                transferSuccessful
            }
        }
    }

    return new SingleTransaction();
}
module.exports = Transaction;