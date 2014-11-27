var helpers = require('./helpers')
  , async = require('async')
  , gcal = require('google-calendar');

function GoogleCalendar(accessToken, clientId, clientSecret, calendarId) {

  var calendarClient = new gcal.GoogleCalendar(accessToken);

  var getEvents = function(timeMin, timeMax, cb) {
    // helper function for getPastEvents and getFutureEvents
    var allEvents = []
      , nextPageToken
      , ready = false;

    function getOnePage(nextPageToken, cb) {

      var options = {
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: timeMin,
        timeMax: timeMax
      };

      if (nextPageToken) {
        options.pageToken = nextPageToken;
      }

      calendarClient.events.list(
        calendarId,
        options,
        function(err, data) {
          if (err) {
            cb(err);
          }
          else {
            cb(null, data.items, data.nextPageToken);
          }
        });
    }

    async.doWhilst(
      function(cb) {
        getOnePage(nextPageToken, function(err, events, next) {
          if (err) {
            cb(err);
          }
          else {
            allEvents = allEvents.concat(events);
            if (next) {
              nextPageToken = next;
            }
            else {
              ready = true;
            }
            cb(null);
          }
        });
      },
      function() {
        return !ready;
      },
      function(err) {
        cb(err, allEvents);
      }
    );
  };

  var getPastEvents = function(args, cb) {
    // fetches past events (start time past)
    // args: (optional)
    //    { dayRange: defaults to 30 }
    // cb(error, items (array))

    var dayRange
      , d
      , startTime
      , endTime;

    if (typeof args === 'function') {
      cb = args;
      args = {};
    }

    dayRange = args.dayRange || 30;
    d = new Date();
    endTime = d.toISOString();
    d.setUTCDate(d.getUTCDate() - dayRange);
    startTime = d.toISOString();

    getEvents(startTime, endTime, cb);

  };

  var getFutureEvents = function(args, cb) {
    // fetches future events (end time in the future)
    // args: (optional)
    //    { dayRange: defaults to 30 }
    // cb(error, items (array))

    var dayRange
      , d
      , startTime
      , endTime;

    if (typeof args === 'function') {
      cb = args;
      args = {};
    }

    dayRange = args.dayRange || 30;
    d = new Date();
    startTime = d.toISOString();
    d.setUTCDate(d.getUTCDate() + dayRange);
    endTime = d.toISOString();

    getEvents(startTime, endTime, cb);
  };

  this.getEvents = getEvents;

  this.getPastEvents = getPastEvents;

  this.getFutureEvents = getFutureEvents;

  this.submitModifiedEvent = function(event, cb) {
    // submits modified event to calendar
    // event is an object containing the new event data and must have property 'id'
    // callback is called with error and modified event as arguments

    if (typeof event !== 'object') {
      return cb(new Error('Missing argument "event"'));
    }
    async.waterfall([
        function (cb) {
          calendarClient.events.get(calendarId, event.id, {}, cb);
        },
        function (foundEvent, cb) {
          calendarClient.events.update(calendarId, foundEvent.id, event, {}, cb);
        }
      ],
      cb);
  };

  this.submitNewEvent = function(event, cb) {
    // Submits new event.
    // callback is called with error and newly created event
    calendarClient.events.insert(
      calendarId,
      event,
      {},
      function(err, result) {
        if (err) {
          cb(new Error(err.message));
        }
        else {
          cb(null, result);
        }
      }
    );
  };

  this.deleteEvent = function(eventId, cb) {
    calendarClient.events.delete(
      calendarId,
      eventId,
      {},
      function(err, result) {
        if (err) {
          cb(new Error(err.message));
        }
        else {
          cb(null);
        }
      }
    );
  };

}

module.exports = GoogleCalendar;
