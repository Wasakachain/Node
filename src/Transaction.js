const { sha256 } = require('../utils');

function Transaction(from, to, value, fee, senderPubKey, data, senderSignature) {
    class SingleTransaction {
        constructor() {
            this.dateCreated = new Date().toISOString();

            this.transationDataHash = sha256(JSON.stringify({
                from,
                to,
                value,
                fee,
                dateCreated: this.dateCreated,
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
                data,
                senderPubKey,
                senderSignature,
            }
        }
    }

    return new SingleTransaction();
}
module.exports = Transaction;