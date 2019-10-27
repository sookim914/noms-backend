const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  place_id: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Place', placeSchema)
