const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

module.exports = mongoose.model('Item', itemSchema)
