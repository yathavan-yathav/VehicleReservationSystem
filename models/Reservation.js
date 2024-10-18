const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  username: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  vehicle_no: { type: String, required: true },
  mileage: { type: Number, required: true },
  message: { type: String }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
