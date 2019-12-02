// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

require('dotenv').config()

const axios = require('axios')
// pull in Mongoose model for places
const Place = require('../models/place')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
// const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { place: { title: '', text: 'foo' } } -> { place: { text: 'foo' } }
// const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /places
// router.get('/places', (req, res, next) => {
//   Place.find()
//     .then(places => {
//       // `places` will be an array of Mongoose documents
//       // we want to convert each one to a POJO, so we use `.map` to
//       // apply `.toObject` to each one
//       return places.map(place => place.toObject())
//     })
//     // respond with status 200 and JSON of the places
//     .then(places => res.status(200).json({ places: places }))
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })

// SHOW
// GET /places/5a7db6c74d55bc51bdf39793
router.get('/places/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Place.findById(req.params.id)
    .populate({
      path: 'reviews items',
      populate: {
        path: 'reviews'
      }
    })
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "place" JSON
    .then(place => res.status(200).json({ place: place.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /places
router.post('/places', requireToken, (req, res, next) => {
  // set owner of new place to be current user
  req.body.query.owner = req.user.id
  axios({
    method: 'GET',
    url: 'https://api.foursquare.com/v2/venues/search',
    params: {
      client_id: process.env.CLIENT_ID,
      v: '20190425',
      ll: req.body.latlong,
      limit: 12,
      categoryId: '4d4b7105d754a06374d81259',
      query: req.body.query.query,
      client_secret: process.env.CLIENT_SECRET
    }
    // get the data from foursquare
  }).then(fsresponse => {
    // return the data.response.venues in array
    return fsresponse.data.response.venues
  })
  // do map interation to go through each index and create a place using name, id, address, and owner
    .then(array => {
      const newArray =
      array.map(place => {
        return Place.findOne({place_id: place.id})
          .then((result) => {
            if (result) {
              return result
            } else {
              return Place.create({
                name: place.name,
                place_id: place.id,
                address: (place.location.formattedAddress).join(', '),
                owner: req.user.id
              })
            }
          })
      })
      return newArray
    })
    .then(newArray => {
      Promise.all(newArray).then((thisarray) =>
        res.status(201).json(thisarray))
    })
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /places/5a7db6c74d55bc51bdf39793
// router.patch('/places/:id', requireToken, removeBlanks, (req, res, next) => {
//   // if the client attempts to change the `owner` property by including a new
//   // owner, prevent that by deleting that key/value pair
//   delete req.body.place.owner
//
//   Place.findById(req.params.id)
//     .then(handle404)
//     .then(place => {
//       // pass the `req` object and the Mongoose record to `requireOwnership`
//
//       requireOwnership(req, place)
//
//       // pass the result of Mongoose's `.update` to the next `.then`
//       return place.updateOne(req.body.place)
//     })
//     // if that succeeded, return 204 and no JSON
//     .then(() => res.sendStatus(204))
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })

// DESTROY
// DELETE /places/5a7db6c74d55bc51bdf39793
// router.delete('/places/:id', requireToken, (req, res, next) => {
//   Place.findById(req.params.id)
//     .then(handle404)
//     .then(place => {
//       // throw an error if current user doesn't own `place`
//       requireOwnership(req, place)
//       // delete the place ONLY IF the above didn't throw
//       place.remove()
//     })
//     // send back 204 and no content if the deletion succeeded
//     .then(() => res.sendStatus(204))
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })

module.exports = router
