var express = require('express');
var bodyParser = require('body-parser');
const cron = require("node-cron")
const Reservations = require('./reservations');
const VehiculosResource = require('./vehiculosResource');
const UsuariosResource = require('./usuariosResource');

var BASE_API_PATH = "/api/v1";

console.log("Starting Reservations service...");

var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(bodyParser.json())





class Error{
    static error = ""
    constructor(message){
        this.error = message
    }
    
}





app.get("/", (req, res) => {
    res.send("<html><body><h1>Reservas OK</h1></body></html>")
});

app.get(`${BASE_API_PATH}/reservas`, (req, res)  => {
    idCliente = req.header('x-user');
    console.log(`user: ${idCliente}`);
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
    Reservations.findById(req.params.id_reservation, (err, reservation) => {
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
    console.log(`${Date()} - POST /reservas`);
    var reservation = req.body;
    fechaCreacion = Date();
    reservation.fechaCreacion = fechaCreacion;
    idCliente = req.header('x-user')


    // Obtenemos los datos del vehiculo
    VehiculosResource.getVehicle(reservation.id_vehicle)
        .then((vehiculo) => {
            console.log("Respuesta")
            // return res.send(vehiculo)
            // Si el vehiculo no está disponible, error
            if(vehiculo.estado !== VehiculosResource.STATUS_DISPONIBLE ){
                return res.send(new Error("Vehiculo no disponible")).status(400);
            }

            // Obtenemos los datos del usuario
            UsuariosResource.getUsuario(idCliente)
            .then((usuario) => {

                if(usuario.permiso !== vehiculo.permiso ){
                    return res.send(new Error("Permiso no adecuado")).status(400);
                }
                
                reservation.creation_datetime = Date.now()
                reservation.expiration_datetime = new Date(Date.now() + ( 360 * 1000))
                reservation.status = 
                Reservations.create(reservation, (err, reservationDB) => {
                    if(err)
                    {
                        console.log(`${Date()} - ${err}`);
                        res.sendStatus(500);
                    }else{
                        console.log(`${Date()} POST /reservas`);

                        VehiculosResource.patchVehicle(reservation.id_vehicle, VehiculosResource.STATUS_RESERVADO)
                        .then((vehiculo) => {
                            
                            res.send(reservationDB).status(201);
                        })
                        .catch((error) => {
                            console.log("error :" + error);

                            Reservations.deleteOne(reservation._id, (err) => {
                                return res.sendStatus(500);
                            });


                        })


                        
                    }
                });





            })
            .catch((error) => {
                console.log("error :" + error);
                return res.sendStatus(500);
            })

        })
        .catch((error) => {
            console.log("error :" + error);
            return res.sendStatus(500);
        })


        console.log("Detrás")
    // Reservations.create(reservation, (err) => {
    //     if(err)
    //     {
    //         console.log(`${Date()} - ${err}`);
    //         res.sendStatus(500);
    //     }else{
    //         console.log(`${Date()} POST /reservas`);
    //         res.sendStatus(201);
    //     }
    // });
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


//** Dejar para pruebas de autenticación - INICIO */
var reservations_aux = [
    {"idReserva": 1, "idCliente": 1, "idVehiculo": 1, "expiracionDatetime": "2020-12-18T13:45:30"},
    {"idReserva": 2, "idCliente": 2, "idVehiculo": 2, "expiracionDatetime": "2020-12-18T13:45:30"}
]

app.get(BASE_API_PATH + "/pruebas-auth", (req, res) => {
    console.log(req.headers)
    idCliente = req.header('x-user')
    if (idCliente){
        var result = [];
        reservations_aux.forEach( _reserva => {
            if( _reserva.idCliente == idCliente){
                result.push(_reserva)
            }
        });
        res.send(result)
    }else{
        res.status(400).send()
    }
});
//** Dejar para pruebas de autenticación - FIN*/


cron.schedule("* * * * *", function () {
    console.log("Running Cron Job");

    Reservations.find({"status": "RESERVADA", "creation_datetime": {$lt: new Date()}}, (err, expiredReservations) => {
        if(err){
            console.log(Date()+" - "+ err);
            
        }else{
            if(expiredReservations == null){
                console.log(`${Date()} No expired`);
            }
            else    
            {
                for( var i = 0; i < expiredReservations.length; i++ ){
                    var reserva = expiredReservations[i]
                    console.log(expiredReservations[i]);

                    // Modifica el estado del vehículo
                    VehiculosResource.patchVehicle(reserva.id_vehicle, VehiculosResource.STATUS_DISPONIBLE)
                        .then((vehiculo) => {
                            // Marca como expirada la reserva
                            reserva.status = "EXPIRADA"
                            Reservations.findOneAndUpdate({_id: reserva._id}, reserva, (erro, reservaDB)=>{

                                if (erro) {
                                    console.log("Error" + erro)
                                }
                            });
                        })
                        .catch((error) => {
                            console.log("error :" + error);
                        })
                }
                

            }
        }
    });

});

module.exports = app;