process.env.IS_TEST = true;
const Reservations = require('../reservations');
const VehiculosResource = require('../vehiculosResource');
const UsuariosResource = require('../usuariosResource');
const ViajesResource = require('../viajesResource');
const app = require('../server.js');
const request = require('supertest');

const rpn = jest.mock('request-promise-native')

// const db = require('../db');



// describe("Hello World test", () => {
//     it("Should do an stupid test", () =>{
//         const a = 5;
//         const b = 3;
//         const sum = a + b;

//         expect(sum).toBe(8);
//     });
// });



describe("Test de reservas", () => {


    /** ESTE TEST NO CONSIGO QUE FUNCIONE PORQUE NO CONSIGO MOCKEAR LA LÍNEA
     * Reservations.find({"id_client": idCliente}).sort({"creation_datetime":"desc"}).exec((err, reservations) => {
     */


    // describe("GET /reservas OK", () => {

    //     beforeAll(() => {            
    //         const reservas = [
    //             new Reservations({"status": "RESERVADA", "id_vehicle": "2334TFG", "id_client": "5ffaf5695dc3ce0fa81f16b2", "destination": "Plaza mayor",
    //             "creation_datetime": 1611324279780, "expiration_datetime": 1611324639780 })
    //         ];

    //         dbFind = jest.spyOn(Reservations, "exec");
    //         dbFind.mockImplementation((callback) => {
    //             callback(null, reservas);
    //         });
    //     });

        
    //     it('Should return all Reservations', () => {
    //         return request(app).get('/api/v1/reservas')
    //             .set({ "x-user": "5ffaf5695dc3ce0fa81f16b2" })
    //             .set({ "x-role": "USER" })
    //             .then((response) => {
    //             expect(response.statusCode).toBe(200);
    //             expect(response.body).toBeArrayOfSize(1);
    //             expect(dbFind).toBeCalledWith({"id_client": "5ffaf5695dc3ce0fa81f16b2"}, expect.any(Function));
    //         });
    //     });
    
    // });



    describe("GET /reservas/<id> OK", () => {
        beforeAll(() => {            
            const reserva =
                new Reservations({"status": "RESERVADA", "id_vehicle": "2334TFG", "id_client": "1",
                "creation_datetime": 1611324279780, "expiration_datetime": 1611324639780 });

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
                expect(response.body.id_vehicle).toBe("2334TFGaaaaa");
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