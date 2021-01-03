const app = require('./server');
const dbConnect = require('./db');

var port = (process.env.PORT || 4041);

console.log("Starting API server at " + port);

dbConnect().then(
    function () {
        app.listen(port);
        console.log("Server ready!");
    },
    err => {
        console.log("Connection error: " +err);
    }
);





