const mongoose = require('mongoose');

const uri = "mongodb+srv://juamoncal:fisequipo1@cluster0.9d47d.mongodb.net/reservations?retryWrites=true&w=majority";
const DB_URL = (process.env.MONGO_URL || uri);
const dbConnect = function() {
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error: '));
    return mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
}

module.exports = dbConnect;