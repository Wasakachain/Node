const { workerData } = require('worker_threads');
const CandidateBlock = require('../models/BlockCandidate');
const { request } = require('../utils/functions');
(async () => {
    try {
        const { candidateBlock } = workerData;
        let block = new CandidateBlock(candidateBlock);
        const minedBlock = await block.mine();
        await request(`http://localhost:5555/mining/submit-mined-block`, 'POST', minedBlock);
    } catch (error) {
        console.log(error)
    }
    process.exit(0);
})()
