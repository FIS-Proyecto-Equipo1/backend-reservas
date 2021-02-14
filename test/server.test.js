process.env.IS_TEST = true;
const Reservations = require('../reservations');
const VehiculosResource = require('../vehiculosResource');
const UsuariosResource = require('../usuariosResource');
const ViajesResource = require('../viajesResource');
const app = require('../server.js');
const request = require('supertest');

const rpn = jest.mock('request-promise-native')




/*
    GET /reservas       |   
        OK: 2 tests
        Error: 1 test
    
    GET /reservas/:id   |   
        OK: 1 test
        Error: 1 test

    POST /reservas      |   
        OK: No he conseguido mockear las llamadas a servicios externos
        Error: 1 test   
    DELETE /reservas    |   
        OK: No he conseguido mockear las llamadas a servicios externos
        Error: 1 test   
    PUT /reservas       |   
        OK: No he conseguido mockear las llamadas a servicios externos
        Error: 1 test   



*/



describe("Test de reservas", () => {

    describe("GET /reservas OK", () => {

        beforeAll(() => {          
            const reservas = [
                new Reservations({"status": "RESERVADA", "id_vehicle": "2334TFG", "id_client": "5ffaf5695dc3ce0fa81f16b2", "destination": "Plaza mayor",
                "creation_datetime": 1611324279780, "expiration_datetime": 1611324639780 }),
                new Reservations({"status": "RESERVADA", "id_vehicle": "6743TRG", "id_client": "5ffaf5695dc3ce0fa81f16b2", "destination": "Plaza mayor",
                "creation_datetime": 1613297375717, "expiration_datetime": 1613297975717 })
            ];

            dbFind = jest.spyOn(Reservations, "find");
            dbFind.mockImplementation((query, callback) => {
                callback(null, reservas);
            });
        });

        
        it('Should return 2 reservations', () => {
            return request(app).get('/api/v1/reservas')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeArrayOfSize(2);
                expect(dbFind).toBeCalledWith({"id_client": "5ffaf5695dc3ce0fa81f16b2"}, expect.any(Function));
            });
        });

        it('Should return ordered reservations', () => {
            return request(app).get('/api/v1/reservas')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeArrayOfSize(2);
                expect(response.body[0].id_vehicle).toBe("6743TRG");
                expect(dbFind).toBeCalledWith({"id_client": "5ffaf5695dc3ce0fa81f16b2"}, expect.any(Function));
            });
        });
    
    });

    describe("GET /reservas ERROR", () => {

        beforeAll(() => {          
            dbFind = jest.spyOn(Reservations, "find");
            dbFind.mockImplementation((query, callback) => {
                callback({"error": "error"}, {});
            });
        });

        
        it('Should return 2 reservations', () => {
            return request(app).get('/api/v1/reservas')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(500);
                expect(response.body.error).toBe("Error al obtener las reservas");
                expect(dbFind).toBeCalledWith({"id_client": "5ffaf5695dc3ce0fa81f16b2"}, expect.any(Function));
            });
        });

    
    });



    describe("GET /reservas/<id> OK", () => {
        beforeAll(() => {            
            const reserva =
                new Reservations({"status": "RESERVADA", "id_vehicle": "2334TFG", "id_client": "5ffaf5695dc3ce0fa81f16b2",
                "creation_datetime": 1611324279780, "expiration_datetime": 1611324639780});

            dbFindById = jest.spyOn(Reservations, "findById");
            dbFindById.mockImplementation((query, callback) => {
                callback(null, reserva);
            });
        });

        
        it('Should return one Reservation', () => {
            return request(app).get('/api/v1/reservas/125151515')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body.id_vehicle).toBe("2334TFG");
                expect(dbFindById).toBeCalledWith("125151515", expect.any(Function));
            });
        });
    
    });


    describe("GET /reservas/<id> ERROR", () => {
        beforeAll(() => {            

            dbFindById = jest.spyOn(Reservations, "findById");
            dbFindById.mockImplementation((query, callback) => {
                callback({error: "error"}, {});
            });
        });

        
        it('Should return one Reservation', () => {
            return request(app).get('/api/v1/reservas/125151515')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(500);
                expect(response.body.error).toBe("Reserva no encontrada");
                expect(dbFindById).toBeCalledWith("125151515", expect.any(Function));
            });
        });
    
    });


    describe("PUT /reservas/:id/desbloquear-vehiculo ERROR", () => {
        dbFindOneDesbl = jest.spyOn(Reservations, "findOne");
        dbFindOneDesbl.mockImplementation((query, callback) => {
            console.log("asdasdasdqweqdasdqwedasdqw :" + query._id)
            if(query._id && query._id == "125151515"){
                callback({error: "error"}, {});
            }else{
                calback(null, null)
            }
        });

        it('Should return 500 error', () => {
            return request(app).put('/api/v1/reservas/125151515/desbloquear-vehiculo')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(500);
                expect(response.body.error).toBe("Reserva no encontrada o ya expirada/iniciada");
                expect(dbFindOneDesbl).toBeCalledWith({"_id":"125151515"}, expect.any(Function));
            });
        });
    });

    describe("DELETE /reservas/:id ERROR", () => {
        dbFindById = jest.spyOn(Reservations, "findOneAndDelete");
        dbFindById.mockImplementation((query, callback) => {
            callback({error: "error"}, {});
        });

        it('Should return one Reservation', () => {
            return request(app).delete('/api/v1/reservas/125151515')
                .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
                .set({ "x-role": "USER" })
                .then((response) => {
                expect(response.statusCode).toBe(500);
                expect(response.body.error).toBe("Reserva no encontrada o ya expirada/iniciada");
                expect(dbFindById).toBeCalledWith("125151515", expect.any(Function));
            });
        });

    });
    /** ESTE TEST NO FUNCIONA PORQUE NO CONSIGO MOCKEAR LAS LLAMADAS A LOS SERVICIOS EXTERNOS */
    // describe("POST /reservas/ OK", () => {
    //     beforeAll(() => {            
    //         const reservaDB =
    //             new Reservations({"status": "RESERVADA", "id_vehicle": "2334TFG", "id_client": "5ffaf5695dc3ce0fa81f16b2",
    //             "creation_datetime": 1611324279780, "expiration_datetime": 1611324639780 });

    //         const vehicleResponse = new Response({"matricula": "2334TFG", "estado": "DISPONIBLE", "permiso": "A"});
    //         const usuarioResponse = {"userId": "5ffaf5695dc3ce0fa81f16b2", "estado": "DISPONIBLE", "permiso": "A"};

    //         const vehicleResponseReserva = {"matricula": "2334TFG", "estado": "RESERVADO", "permiso": "A"};
            
    //         vehiculoGet = jest.spyOn(VehiculosResource, "getVehicle");
    //         // vehiculoGet.mockImplementation((idVehiculo, callback) => {
    //         //     callback(null, vehicleResponse);
    //         // });
    //         vehiculoGet.mockImplementation(() => ({
    //             promise: jest.fn().mockImplementation(() => Promise.resolve(vehicleResponse))
    //         }));
            

    //         usuarioGet = jest.spyOn(UsuariosResource, "getUsuario");
    //         usuarioGet.mockImplementation((idUsuario, callback) => {
    //             callback(null, usuarioResponse);
    //         });

    //         vehiculoGet = jest.spyOn(VehiculosResource, "patchVehicle");
    //         vehiculoGet.mockImplementation((idVehiculo, status, callback) => {
    //             callback(null, vehicleResponseReserva);
    //         });


    //         dbCreate = jest.spyOn(Reservations, "create");
    //         dbCreate.mockImplementation((query, callback) => {
    //             callback(null, reservaDB);
    //         });
    //     });

        
    //     it('Should return one Reservation', () => {
    //         return request(app).post('/api/v1/reservas/')
    //             .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
    //             .set({ "x-role": "USER" })
    //             .then((response) => {
    //             // expect(response.statusCode).toBe(200);
    //             expect(response.body).toBe("2334TFG");
    //             expect(usuarioGet).toBeCalledWith("5ffaf5695dc3ce0fa81f16b2", expect.any(Function));
    //         });
    //     });
    
    // });
    
});