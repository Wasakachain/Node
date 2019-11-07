const Express = require('express');
const App = Express();
// importing routes
const Routes = require('./src/Routes/NodeRoutes');
// App routes
App.use('/', Routes);

// turn on the server
const nodeServer = App.listen(5555, () => {
    console.log('\x1b[36m%s\x1b[0m','Node server is running!');
    console.log('\x1b[42m%s\x1b[0m','\t\t\t-/-/-/-¡Enjoy WasakaChain!-/-/-/\t\t\t');
});
