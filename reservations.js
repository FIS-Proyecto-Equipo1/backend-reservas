const mongoose = require('mongoose');

let estadosValidos = {
    values: ["RESERVADA", "EXPIRADA", "INICIADA"],
    message: '{VALUE} no es un estado válido'
}

const reservationsSchema = new mongoose.Schema({
    id_vehicle: { type: String, required: [true, "Es necesario el id de vehiculo"] },
    id_client: { type: String, required: [true, "Es necesario el id de cliente"] },
    status: {type: String, default: "RESERVADA",required: true, enum: estadosValidos},
    creation_datetime: { type: Number, required: false },
    expiration_datetime: { type: Number, required: false }
});

mongoose.set('useCreateIndex', true);

reservationsSchema.methods.cleanup = function() {
    return {_id: this._id, id_vehicle: this.id_vehicle, id_client: this.id_client, status: this.status,
    creation_datetime: this.creation_datetime, expiration_datetime: this.expiration_datetime};
}

const Reservations = mongoose.model('Reservations', reservationsSchema);
module.exports = Reservations;