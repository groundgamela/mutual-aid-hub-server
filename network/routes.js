'use strict';

const express = require('express');
const jsonParser = require('body-parser').json();
const map = require('lodash').map;
const filter = require('lodash').filter;
const forEach = require('lodash').forEach;


const processEvent = require('./process-one-event');
const Event = require('./index');

const eventRouter = module.exports = express.Router();

eventRouter.post('/validate-events',
    jsonParser,
    (req, res, next) => {
        console.log('post, req.body.events', req.body.events.length);
        if (!req.body.events || !req.body.events.length) {
        return next({
                statusCode: 400,
                message: 'need a list of events sent as {events: []}'
            });
        }

        if (req.body.events.length > 50) {
            return next({
                statusCode: 400,
                message: 'can only process 25 at a time'
            })
        }
        const newEvents = req.body.events;
        req.events = map(newEvents, (event) => {
            const newEvent = new Event(event);
            newEvent.convertDataFromJson();
            return newEvent;

        })
        console.log('made events list', req.events.length)
        next();
    },
    (req, res, next) => {
        req.events = filter(req.events, newEvent => {
            return newEvent.streetAddress || newEvent.city || newEvent.state
        });
        req.failed_events = map(filter(req.events, newEvent => {
            return !newEvent.streetAddress && newEvent.city && newEvent.state
        }), 'id');
        forEach(req.events, (newEvent, index) => {
            console.log('getting lat lng', index)
            return newEvent.getLatandLog()
                .then(() => {
                    console.log(index, req.events.length)
                    if (index + 1 === req.events.length) {
                        console.log('calling next in success')
                        next();
                    }
                }).catch((error) => {
                     console.log(index, req.events.length)
                     if (index + 1 === req.events.length) {
                         console.log('calling next in error')
                         next();
                     }
                    console.log(error.message, index)
                })

            })
    },
    (req, res) => {
        req.events = map(req.events, (newEvent, index) => {
            if (newEvent.lat) {
                setTimeout(() => {
                    processEvent(newEvent)
                }, index * 1000)

            }
        })
        console.log('finished queuing requests')
        res.send({message: { failed_ids: req.failed_events}});
    }
)
