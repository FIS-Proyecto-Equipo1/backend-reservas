var express = require('express');
var bodyParser = require('body-parser');
const cron = require("node-cron")
const Reservations = require('./reservations');
const VehiculosResource = require('./vehiculosResource');
const UsuariosResource = require('./usuariosResource');
const ViajesResource = require('./viajesResource');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

var options = {
  explorer: true
};

var BASE_API_PATH = "/api/v1";

console.log("Starting Reservations service...");

var app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));


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
    rol = req.header('x-rol');
    console.log(`user: ${idCliente}`);

    var query = {"id_client": idCliente}
    if(rol === "ADMIN"){
        query = {}
    }

    Reservations.find(query).sort({"creation_datetime":"desc"}).exec((err, reservations) => {
        if(err){
            console.log(`${Date()} - ${err}`);
            return res.status(500).send(new Error("Error al obtener las reservas"));
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
            return res.status(500).send(new Error("Reserva no encontrada"));
        }else{
            if(reservation == null){
                console.log(`${Date()} GET /reservas/${req.params.id_reservation} - Not found`);
                return res.status(500).send(new Error("Reserva no encontrada"));
            }
            else    
            {
                console.log(`${Date()} GET /reservas/${req.params.id_reservation}`);
                return res.send(reservation.cleanup());
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
                return res.status(400).send(new Error("Vehiculo no disponible"));
            }

            // Obtenemos los datos del usuario
            UsuariosResource.getUsuario(idCliente)
            .then((usuario) => {

                console.log("Usuario: " + usuario.permiso +", Vehiculo: "+ vehiculo.permiso)
                if(!(usuario.permiso == "AB" || (usuario.permiso == "B" &&  vehiculo.permiso != "AB") || vehiculo.permiso == "NO" )){
                    return res.status(400).send(new Error("Permiso de conducir no adecuado"));
                }
                
                reservation.id_client = idCliente
                reservation.creation_datetime = Date.now()
                reservation.expiration_datetime = new Date(Date.now() + ( 600 * 1000))
                reservation.status = 
                Reservations.create(reservation, (err, reservationDB) => {
                    if(err)
                    {
                        console.log(`${Date()} - ${err}`);
                        return res.status(500).send(new Error("Error al crear la reserva"));
                    }else{
                        console.log(`${Date()} POST /reservas`);

                        VehiculosResource.patchVehicle(reservation.id_vehicle, VehiculosResource.STATUS_RESERVADO)
                        .then((vehiculo) => {
                            
                            return res.status(201).send(reservationDB);
                        })
                        .catch((error) => {
                            console.log("error :" + error);

                            Reservations.deleteOne(reservation._id, (err) => {
                                return res.status(500).send(new Error("Error al actualizar el vehículo"));
                            });


                        })


                        
                    }
                });





            })
            .catch((error) => {
                console.log("error :" + error);
                return res.status(500).send(new Error("Error al localizar al usuario"));
            })

        })
        .catch((error) => {
            console.log("error :" + error);
            return res.status(500).send(new Error("Error al localizar al vehiculo"));
        })
});





app.delete(`${BASE_API_PATH}/reservas/:id_reservation`, (req, res)  => {
    let reservation = req.params.id_reservation;
    let query = {"_id": reservation, "status":"RESERVADA"}
    let rol = req.header('x-role');
    if(rol === "ADMIN"){
        query = {"_id": reservation}
    }

    Reservations.findOneAndDelete(query, (err, reservationDB) => {
        if(err || reservationDB == undefined)
        {    
            console.log(err);
            return res.status(500).send(new Error("Reserva no encontrada o ya expirada/iniciada"));
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




app.put(`${BASE_API_PATH}/reservas/:id_reservation/desbloquear-vehiculo`, (req, res)  => {
    Reservations.findOne({"_id": req.params.id_reservation}, (err, reserva) => {
        if(err){
            console.log(Date()+" - "+ err);
            res.sendStatus(500);
        }else{
            if(reserva == null){
                console.log(`${Date()} POST /reservas/${req.params.id_reservation}/desbloquear-vehiculo - Invalid`);
                return res.status(404).send(new Error("Reserva no encontrada"));
            }
            else    
            {
                //TODO - comprobar que la reserva no está ni expirada ni iniciada!!
                console.log(reserva)
                if(reserva.status !== "RESERVADA"){
                    return res.status(400).send(new Error("Reserva ya iniciada o expirada"));
                }




                console.log(`${Date()} POST /reservas/${req.params.id_reservation}/desbloquear-vehiculo`);
                // Llamar a iniciar viaje de la api de viajes
                
                ViajesResource.postViaje(reserva.id_client, reserva.id_vehicle)
                .then((viaje) => {
                    
                    reserva.status = "COMPLETADA"
                    reserva.expiration_datetime = ''


                    VehiculosResource.patchVehicleLocalizacion(reserva.id_vehicle, VehiculosResource.STATUS_TRAYECTO, reserva.destination)
                    .then((vehiculo) => {
                        Reservations.findOneAndUpdate({_id: reserva._id}, reserva, (erro, reservaDB)=>{
                            
                            if (erro) {
                                console.log("Error" + erro)
                                return res.status(500).send(new Error("Error al actualizar la reserva"));
                            }else{
                                return res.status(201).send(reservaDB);
                            }
                        });

                    })
                    .catch((error) => {
                        console.log("error :" + error);
                        return res.status(500).send(new Error("Error al iniciar el viaje"));
                    })


                    
                    
                })
                .catch((error) => {
                    console.log("error :" + error);
                    return res.status(500).send(new Error("Error al iniciar el viaje"));
                })
            }
        }
    });
});


// if(process.env.IS_TEST === undefined || !process.env.IS_TEST){
//     console.log("Iniciamos cron")
//     cron.schedule("* * * * *", function () {
//         console.log("Cron Job para expirar reservas caducadas");
    
//         momento = new Date();
//         // console.log(momento)
//         momento.setMinutes(momento.getMinutes() - 10);
//         // console.log(momento)
//         Reservations.find({"status": "RESERVADA", "creation_datetime": {$lt: momento}}, (err, expiredReservations) => {
//             if(err){
//                 console.log(Date()+" - "+ err);
                
//             }else{
//                 if(expiredReservations == null){
//                     console.log(`${Date()} No expired`);
//                 }
//                 else    
//                 {
//                     for( var i = 0; i < expiredReservations.length; i++ ){
//                         var reserva = expiredReservations[i]
//                         console.log(expiredReservations[i]);
    
//                         // Modifica el estado del vehículo
//                         VehiculosResource.patchVehicle(reserva.id_vehicle, VehiculosResource.STATUS_DISPONIBLE)
//                             .then((vehiculo) => {
//                                 // Marca como expirada la reserva
//                                 reserva.status = "EXPIRADA"
//                                 Reservations.findOneAndUpdate({_id: reserva._id}, reserva, (erro, reservaDB)=>{
    
//                                     if (erro) {
//                                         console.log("Error" + erro)
//                                     }
//                                 });
//                             })
//                             .catch((error) => {
//                                 console.log("error :" + error);
//                             })
//                     }
                    
    
//                 }
//             }
//         });
    
//     });
// }


module.exports = app;