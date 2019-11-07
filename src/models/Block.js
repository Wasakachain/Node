const { sha256 } = require('../utils/hash')

function Block({ index, difficulty, prevBlockHash, transactions, nonce, minedBy }) {
    let blockDataHash = null;
    let dateCreated = null;
    let blockHash = null;
    class BlockClass {
        constructor() {
            blockDataHash = sha256(JSON.stringify({ index, transactions, difficulty, prevBlockHash, minedBy }));
            dateCreated = new Date().toISOString();
            blockHash = sha256(JSON.stringify({ blockDataHash, dateCreated, nonce }));
        }

        getData() {
            return {
                index,
                transactions,
                difficulty,
                prevBlockHash: prevBlockHash,
                minedBy,
                blockDataHash,
                nonce,
                dateCreated,
                blockHash,
            }
        }
    }
    return new BlockClass();
}


module.exports = Block;