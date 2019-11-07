const Express = require('express');
const App = Express();
// importing routes
const Routes = require('./Routes/NodeRoutes.js');

// App routes
App.use('/', Routes);

// turn on the server
const nodeServer = App.listen(5555, () => {
    console.log('\nNode server is running! in port 5555\n\n¡Enjoy WasakaChain!');
});
