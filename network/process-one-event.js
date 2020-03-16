const {
    firebase
} = require('../lib/setupFirebase');

const testing = process.env.NODE_ENV !== 'production';
const validate = require('../lib/schema');


function processEvent(newEvent) {
    newEvent.getTimeZone()
        .then(() => {
            const databaseEvent = newEvent.createDatabaseEvent();
            const valid = validate.xrEvent(databaseEvent);
            if (valid) {
                // R, S, T, U
                // id,	validated, 	formatted_address, 	last_updated
                console.log('valid')
                if (!testing) {
                    console.log('writing', databaseEvent.id)
                    firebase.ref(`events/${databaseEvent.id}`).update(databaseEvent);
                }
            } else {
                console.log('failed', databaseEvent.id, validate.xrEvent.errors[0].dataPath);
            }
        }).catch((error) => console.log('getting lat lng', error.message))
}

module.exports = processEvent;