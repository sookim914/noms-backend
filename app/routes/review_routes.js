// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

// pull in Mongoose model for examples
const Review = require('../models/review')
const Item = require('../models/item')

const { fileUploadApi, s3Delete } = require('../../lib/fileUploadApi')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// // GET /examples
// router.get('/reviews', (req, res, next) => {
//   Item.findById(req.params.id)
//     .then(item => {
//       // `examples` will be an array of Mongoose documents
//       // we want to convert each one to a POJO, so we use `.map` to
//       // apply `.toObject` to each one
//       return item.reviews.map(review => review.toObject())
//     })
//     // respond with status 200 and JSON of the examples
//     .then(reviews => res.status(200).json({ reviews: reviews }))
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })

// SHOW
// GET /examples/5a7db6c74d55bc51bdf39793
router.get('/items/:id/reviews/:rid', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  console.log(req.params.rid)
  Review.findById(req.params.rid)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "example" JSON
    .then(review => res.status(200).json({ review: review.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /fileUploads
router.post('/items/:id/reviews', requireToken, upload.single('upload'), (req, res, next) => {
  // console.log('here', req.body)
  // req.review.owner = req.user.id
  // console.log(req.user)
  const itemId = req.params.id

  if (req.file) {
    fileUploadApi(req.file)
      .then(s3Response => {
        const reviewUploadParams = {
          name: s3Response.Key,
          rating: req.body.rating,
          url: s3Response.Location,
          owner: req.user,
          comment: req.body.comment
        }
        return Review.create(reviewUploadParams)
      })
      .then(review => {
        res.status(201).json({ review: review.toObject() })
        Item.findById(itemId)
          .then(item => {
            item.reviews.push(review)
            item.save()
          })
      })
      .catch(next)
  } else {
    req.body.owner = req.user.id
    Review.create(req.body)
      .then(review => {
        res.status(201).json({ review: review.toObject() })
        Item.findById(itemId)
          .then(item => {
            item.reviews.push(review)
            item.save()
          })
      })
      .catch(next)
  }
})

// UPDATE
// PATCH /examples/5a7db6c74d55bc51bdf39793
router.patch('/items/:id/reviews/:rid', upload.single('url'), requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.owner
  if (req.file) {
    fileUploadApi(req.file)
      .then(s3Response => {
        Review.findById(req.params.rid)
          .then(handle404)
          .then(review => {
            requireOwnership(req, review)
            if (review.url) {
              s3Delete({
                Bucket: process.env.nomsbucket,
                Key: review.url.split('/').pop()
              })
            }
            return review.update({
              ...req.body,
              url: s3Response.Location
            })
          })
          .then(() => res.sendStatus(204))
          .catch(next)
      })
  } else {
    req.body.owner = req.user.id
    Review.findById(req.params.rid)
      .then(handle404)
      .then(review => {
        requireOwnership(req, review)
        review.set(req.body)
        return review.save()
      })
      .then(() => res.sendStatus(204))
      .catch(next)
  }
})

// DESTROY
// DELETE /examples/5a7db6c74d55bc51bdf39793
router.delete('/items/:id/reviews/:rid', requireToken, (req, res, next) => {
  Review.findById(req.params.rid)
    .then(handle404)
    .then(review => {
      // throw an error if current user doesn't own `example`
      requireOwnership(req, review)
      return review.remove()
    })
    .then(review => {
      Item.findById(req.params.id)
        .then(item => {
          item.reviews.pull(req.params.rid)
          item.save()
        })
      res.sendStatus(204)
    })
    .catch(next)
})

module.exports = router
