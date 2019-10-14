const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  name: {
    type: String
  },
  rating: {
    type: Number,
    required: true
  },
  fileType: {
    type: String
    // required: true
  },
  url: {
    type: String
    // required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Review', reviewSchema)
