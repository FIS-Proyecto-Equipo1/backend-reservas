var express = require('express');
var bodyParser = require('body-parser');
const cron = require("node-cron")
const Reservations = require('./reservations');
const VehiculosResource = require('./vehiculosResource');
const UsuariosResource = require('./usuariosResource');
const ViajesResource = require('./viajesResource');

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
    static error
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
            res.send(new Error("Error al obtener las reservas")).status(500);
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
            return res.send(new Error("Reserva no encontrada")).status(500);
        }else{
            if(reservation == null){
                console.log(`${Date()} GET /reservas/${req.params.id_reservation} - Not found`);
                return res.send(new Error("Reserva no encontrada")).status(500);
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
                
                reservation.id_client = idCliente
                reservation.creation_datetime = Date.now()
                reservation.expiration_datetime = new Date(Date.now() + ( 600 * 1000))
                reservation.status = 
                Reservations.create(reservation, (err, reservationDB) => {
                    if(err)
                    {
                        console.log(`${Date()} - ${err}`);
                        return res.send(new Error("Error al crear la reserva")).status(500);
                    }else{
                        console.log(`${Date()} POST /reservas`);

                        VehiculosResource.patchVehicle(reservation.id_vehicle, VehiculosResource.STATUS_RESERVADO)
                        .then((vehiculo) => {
                            
                            return res.send(reservationDB).status(201);
                        })
                        .catch((error) => {
                            console.log("error :" + error);

                            Reservations.deleteOne(reservation._id, (err) => {
                                return res.send(new Error("Error al actualizar el vehículo")).status(500);
                            });


                        })


                        
                    }
                });





            })
            .catch((error) => {
                console.log("error :" + error);
                return res.send(new Error("Error al localizar al usuario")).status(500);
            })

        })
        .catch((error) => {
            console.log("error :" + error);
            return res.send(new Error("Error al localizar al vehiculo")).status(500);
        })
});





app.delete(`${BASE_API_PATH}/reservas/:id_reservation`, (req, res)  => {
    let reservation = req.params.id_reservation;

    Reservations.findOneAndDelete({"_id": reservation, "status":"RESERVADA"}, (err, reservationDB) => {
        if(err || reservationDB == undefined)
        {    
            console.log(err);
            return res.send(new Error("Reserva no encontrada o ya expirada/iniciada")).status(500);
        }else
        {
            VehiculosResource.patchVehicle(reservationDB.id_vehicle, VehiculosResource.STATUS_DISPONIBLE)
            .then((vehiculo) => {
                console.log(`${Date()} DELETE /reservas/${reservation}`);
                return res.status(200).send({message : `Reservation ${reservation} removed`});
            })
            .catch((error) => {
                console.log("error :" + error);
                return res.status(200).send({message : `Reservation ${reservation} removed`});
            })
        
        }
    });
});




app.post(`${BASE_API_PATH}/reservas/:id_reservation/desbloquear-vehiculo`, (req, res)  => {
    Reservations.findOne({"id_reservation": req.params._id}, (err, reserva) => {
        if(err){
            console.log(Date()+" - "+ err);
            res.sendStatus(500);
        }else{
            if(reserva == null){
                console.log(`${Date()} POST /reservas/${req.params.id_reservation}/desbloquear-vehiculo - Invalid`);
                return res.send(new Error("Reserva no encontrada")).status(404);
            }
            else    
            {
                //TODO - comprobar que la reserva no está ni expirada ni iniciada!!
                if(reserva.estado != "RESERVADA"){
                    return res.send(new Error("Reserva ya iniciada o expirada")).status(400);
                }




                console.log(`${Date()} POST /reservas/${req.params.id_reservation}/desbloquear-vehiculo`);
                // Llamar a iniciar viaje de la api de viajes
                
                ViajesResource.postViaje(reserva.id_client, reserva.id_vehicle)
                .then((viaje) => {
                    
                    reserva.status = "INICIADA"
                    Reservations.findOneAndUpdate({_id: reserva._id}, reserva, (erro, reservaDB)=>{
                            
                        if (erro) {
                            console.log("Error" + erro)
                            return res.send(new Error("Error al actualizar la reserva")).status(500);
                        }else{
                            return res.send(reservaDB).status(201);
                        }
                    });
                    
                })
                .catch((error) => {
                    console.log("error :" + error);
                    return res.send(new Error("Error al iniciar el viaje")).status(500);
                })
            }
        }
    });
});


if(process.env.IS_TEST === undefined || !process.env.IS_TEST){
    cron.schedule("* * * * *", function () {
        console.log("Cron Job para expirar reservas caducadas");
    
        momento = new Date();
        // console.log(momento)
        momento.setMinutes(momento.getMinutes() - 10);
        // console.log(momento)
        Reservations.find({"status": "RESERVADA", "creation_datetime": {$lt: momento}}, (err, expiredReservations) => {
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
}


module.exports = app;