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

app.get("/", (req, res) => {
    res.send("<html><body><h1>Reservas OK</h1></body></html>")
});

app.get(`${BASE_API_PATH}/reservas`, (req, res)  => {
    Reservations.find(req.query, (err, reservations) => {
        if(err){
            console.log(`${Date()} - ${err}`);
            res.sendStatus(500);
        }else{
            console.log(`${Date()} GET /reservas`)
            res.send(reservations.map((reservation) => {
                return reservation.cleanup();
            }));
        }
    });
});

app.get(`${BASE_API_PATH}/reservas/:id_reservation`, (req, res)  => {
    Reservations.findOne({"id_reservation": req.params.id_reservation}, (err, reservation) => {
        if(err){
            console.log(`${Date()} - ${err}`);
            res.sendStatus(500);
        }else{
            if(reservation == null){
                console.log(`${Date()} GET /reservas/${req.params.id_reservation} - Not found`);
                res.sendStatus(404);
            }
            else    
            {
                console.log(`${Date()} GET /reservas/${req.params.id_reservation}`);
                res.send(reservation.cleanup());
            }
        }
    });
});

app.post(`${BASE_API_PATH}/reservas`, (req, res)  => {
    var reservation = req.body;
    Reservations.create(reservation, (err) => {
        if(err)
        {
            console.log(`${Date()} - ${err}`);
            res.sendStatus(500);
        }else{
            console.log(`${Date()} POST /reservas`);
            res.sendStatus(201);
        }
    });
});

app.delete(`${BASE_API_PATH}/reservas/:id_reservation`, (req, res)  => {
    let reservation = req.params.id_reservation;

    Reservations.findOneAndDelete({"id_reservation": reservation}, (err) => {
        if(err)
        {    
            console.log(err);
            res.sendStatus(500);
        }else
        {
            console.log(`${Date()} DELETE /reservas/${reservation}`);
            res.status(200).send({message : `Reservation ${reservation} removed`});
        }
    });
});

app.post(`${BASE_API_PATH}/reservas/:id_reservation/desbloquear-vehiculo`, (req, res)  => {
    Reservations.findOne({"id_reservation": req.params.id_reservation}, (err, reservation) => {
        if(err){
            console.log(Date()+" - "+ err);
            res.sendStatus(500);
        }else{
            if(reservation == null){
                console.log(`${Date()} POST /reservas/${req.params.id_reservation}/desbloquear-vehiculo - Invalid`);
                res.sendStatus(404);
            }
            else    
            {
                console.log(`${Date()} POST /reservas/${req.params.id_reservation}/desbloquear-vehiculo`);
                // TODO: Llamar a desbloquear vehiculo de la api de vehiculos con el id_vehiculo
                // let vehicle = apiVehicule.get(BASE_API_PATH + "/vehicle" + reservation.id_vehicle);
                // set estado to RESERVADO

                res.send(reservation.cleanup());
            }
        }
    });
});

module.exports = app;