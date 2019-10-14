const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  reviews: [{
    review_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  }]
})

module.exports = mongoose.model('Item', itemSchema)
