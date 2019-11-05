const Express = require('express');
const app = Express();
const blockRoutes = require('./Routes/BlockRoutes.js');

// app routes
app.use('/block', blockRoutes);


// turn on the server
const nodeServer = app.listen(5555, () => {
    console.log('Node server is running! in port 5555');
});
