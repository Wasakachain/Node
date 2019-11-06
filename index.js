const Express = require('express');
const App = Express();
// importing routes
const BlocksRoutes = require('./Routes/BlocksRoutes.js');
const TransactionsRoutes = require('./Routes/TransactionsRoutes.js');
const NodeRoutes = require('./Routes/NodeRoutes.js');

// App routes
App.use('/', NodeRoutes);
App.use('/blocks', BlocksRoutes);
App.use('/transactions', TransactionsRoutes);


// turn on the server
const nodeServer = App.listen(5555, () => {
    console.log('\nNode server is running! in port 5555\n\n¡Enjoy WasakaChain!');
});