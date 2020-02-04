// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for items
const Item = require('../models/item')
const Place = require('../models/place')
const axios = require('axios')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { item: { title: '', text: 'foo' } } -> { item: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// SHOW
// GET /places/5a7db6c74d55bc51bdf39793
router.get('/places/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Place.findById(req.params.id)
    .then(handle404)
    .then(place => place.place_id)
    .then(placeId =>
      axios({
        method: 'GET',
        url: 'https://api.foursquare.com/v2/venues/' + placeId + '/menu',
        params: {
          client_id: process.env.CLIENT_ID,
          v: '20190425',
          client_secret: process.env.CLIENT_SECRET
        }
      }))
    .then(menuresponse => {
      const hello = menuresponse.data.response.menu.menus
      const count = menuresponse.data.response.menu.menus.count
      let array = []
      // get menu data
      if (count > 0) {
        hello.items[0].entries.items.map(section => {
          section.entries.items.map(item => array.push(item))
        })
        return array
        // return menuresponse.data.response.menu.menus.items[0].entries.items[0].entries.items
      } else {
        return []
      }
    })
    .then(array => {
      return array.map(item => {
        return Item.findOne({item_id: item.entryId}).exec()
          .then((result) => {
            if (result) {
              return result
            } else {
              return Item.create({
                name: item.name,
                item_id: item.entryId
              })
                .then(item => {
                  return Place.findById(req.params.id).exec()
                    .then(place => {
                      place.items.push(item)
                      return place.save()
                    })
                })
            }
          })
      })
    })
    .then(newArray => {
      Promise.all(newArray).then(thisarray => {
        Place.findById(req.params.id)
          .populate({
            path: 'reviews items',
            populate: {
              path: 'reviews'
            }
          }).exec()
          .then(place => {
            res.status(200).json({place: place.toObject()})
          })
      })
    })
    .catch(next)
})

// CREATE
// POST /items
// Create an item & add it to the menu
router.post('/places/:id/items', requireToken, (req, res, next) => {
  const placeId = req.params.id
  req.body.item.owner = req.user.id
  Item.create(req.body.item)
    // respond to succesful `create` with status 201 and JSON of new "item"
    .then(item => {
      res.status(201).json({ item: item.toObject() })
      Place.findById(placeId)
        .then(place => {
          place.items.push(item)
          place.save()
        })
        .catch(next)
    })

    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /items/5a7db6c74d55bc51bdf39793
router.patch('/items/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.item.owner

  Item.findById(req.params.id)
    .then(handle404)
    .then(item => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      // requireOwnership(req, item)
      requireOwnership(req, item)
      // pass the result of Mongoose's `.update` to the next `.then`
      return item.updateOne(req.body.item)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /items/5a7db6c74d55bc51bdf39793
router.delete('/items/:id', requireToken, (req, res, next) => {
  Item.findById(req.params.id)
    .then(handle404)
    .then(item => {
      // throw an error if current user doesn't own `item`
      requireOwnership(req, item)
      // delete the item ONLY IF the above didn't throw
      item.remove()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
