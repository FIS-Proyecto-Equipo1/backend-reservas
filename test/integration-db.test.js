const Reservations = require('../reservations.js');
const mongoose = require('mongoose');
const dbConnect = require('../db.js');

jest.setTimeout(30000);

describe('Vehicle db connection', ()=>{

    beforeAll(()=>{
        return dbConnect(); 
    })

    beforeEach((done)=>{
        Reservations.deleteMany({}, (err)=>{
            done();
        });
    });

    it('writes a contact in the DB', (done)=>{
        const reserva =
                new Reservations({"status": "RESERVADA", "id_vehicle": "123123", "id_client": "5ffaf5695dc3ce0fa81f16b2", "destination": "Plaza mayor",
                "creation_datetime": 1611324279780, "expiration_datetime": 1611324639780 });

        // const reserva = new Reservations({"matricula":"2345TGF", "tipo": "Moto", "estado":"RESERVADO", "permiso":"AB", "localizacion" : "Malaga" })
        reserva.save((err, reservaDB) => {
            expect(err).toBeNull();

            Reservations.findOne({"_id": reservaDB._id}, (err, reserva) => {
                expect(reserva.id_vehicle).toBe("123123");
                done();
            });

            Reservations.findOneAndDelete({"_id": reservaDB._id}, (err, reservationDB) => {
                done();
            });
        });
    })


    afterAll((done) => {
        mongoose.connection.db.DropDatabase(() => {
            mongoose.connection.close(done);
        })
    })
})