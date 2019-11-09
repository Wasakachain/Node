const Express = require('express');
const App = Express();
// importing routes
const Routes = require('./src/Routes/NodeRoutes');

const PORT = process.env.port || 5555;

App.use(Express.json());
App.use(Express.urlencoded({ extended: true }));

// App routes
App.use('/', Routes);

// App.use(Express.json);
// turn on the server
App.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `Node server is running on port ${PORT}!`);
    console.log('\x1b[42m%s\x1b[0m', '\t\t\t-/-/-/-¡Enjoy WasakaChain!-/-/-/\t\t\t');
});
