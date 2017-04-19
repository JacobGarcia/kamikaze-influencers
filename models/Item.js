const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  name: String,
  description: String,
  days: { type: Number, required: true },
  hallOfFame: { Boolean, default: false },
  price: { type: Number, required: true },
  discount: Number,
  type: { type: Number, default: 0 }
})

module.exports = mongoose.model('Item', schema)
