const mongoose = require('mongoose');
const reservationsSchema = new mongoose.Schema({
    id_reservation: { type: Number, required: true, index: { unique: true } },
    id_vehicle: { type: String, required: true },
    id_client: { type: Number, required: true },
    creation_datetime: { type: Number, required: false },
    expiration_datetime: { type: Number, required: false }
});

mongoose.set('useCreateIndex', true);

reservationsSchema.methods.cleanup = function() {
    return {id_reservation: this.id_reservation, id_vehicle: this.id_vehicle, id_client: this.id_client,
    creation_datetime: this.creation_datetime, expiration_datetime: this.expiration_datetime};
}

const Reservations = mongoose.model('Reservations', reservationsSchema);
module.exports = Reservations;