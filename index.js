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
<<<<<<< HEAD
const nodeServer = app.listen(5555, () => {
    console.log('Node server is running! in port 5555');
});
=======
const nodeServer = App.listen(5555, () => {
    console.log('\nNode server is running! in port 5555\n\n¡Enjoy WasakaChain!');
});
>>>>>>> 55e17c2129ed88874cb1601ca51f2632d0233974
