const Express = require('express');
const App = Express();
// importing routes
const node = new (require('./src/models/Node'))();
exports.node = node;
const Routes = require('./src/Routes/NodeRoutes');
const { handleNotFound, setCorsHeadersMiddleware } = require('./src/utils/functions');
const PORT = process.env.port || 5555;



exports.WASA = 1000000;
exports.AVO = 1000;
exports.GAR = 1;

App.use(Express.json());
App.use(Express.urlencoded({ extended: true }));

// App routes
App.use(setCorsHeadersMiddleware);
App.use('/', Routes);
App.use(handleNotFound);

// turn on the server
App.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `\n\nNode server is running on port ${PORT}!`);
    console.log('\x1b[42m%s\x1b[0m', '\t\t\t-/-/-/-¡Enjoy WasakaChain!-/-/-/\t\t\t');
});