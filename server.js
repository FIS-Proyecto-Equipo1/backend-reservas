var express = require('express');
var bodyParser = require('body-parser');
const Reservations = require('./reservations');

var BASE_API_PATH = "/api/v1";

console.log("Starting Reservations service...");

var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(bodyParser.json())
  
var reservations = [
    {"idCliente": 1, "idVehiculo": 1, "expiracionDatetime": "2020-12-18T13:45:30"}
]

app.get("/", (req, res) => {
    res.send("<html><body><h1>Hello World Ma boy</h1></body></html>")
});

app.get(BASE_API_PATH + "/reservas", (req, res) => {
    var result = [];
    if(req.query.idcliente){
        // console.log(req.query.idcliente)
        reservations.forEach( _reserva => {
            // console.log( _reserva.idCliente)
            // console.log( req.query.idcliente)
            // console.log( _reserva.idCliente == req.query.idcliente)
            if( _reserva.idCliente == req.query.idcliente){
                result.push(_reserva)
            }
        });
    }
    res.send(result)
});

module.exports = app;