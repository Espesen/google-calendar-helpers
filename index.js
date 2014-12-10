var helpers = require('./helpers')
  , async = require('async')
  , _ = require('underscore')
  , gcal = require('google-calendar');

function GoogleCalendar(accessToken, clientId, clientSecret, calendarId) {

  var calendarClient = new gcal.GoogleCalendar(accessToken);

  var responseHandler = function(options, cb) {

    var includeResult = options.includeResult;

    var parseError = function(error) {
      if (!error) { return null; }
      if (error instanceof Error) { return error; }
      if ("message" in error) { return new Error(error.message); }
      return error;
    };

    return function(error, result) {
      if (!includeResult) {
        cb(parseError(error));
      }
      else {
        cb(parseError(error), result);
      }
    };

  };

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
        responseHandler({ includeResult: true }, cb)(err, allEvents);
      }
    );
  };

  var getPastEvents = function(args, cb) {
    // fetches past events
    // args: (optional)
    //    { dayRange: defaults to 30
    //      endTimePast: boolean - set to true to fetch only events that have ended, e.g. whose end time is in the past
    //    }
    // cb(error, items (array))


    if (typeof args === 'function') {
      cb = args;
      args = {};
    }

    var dayRange
      , endTimePast
      , d
      , startTime
      , endTime;

    // filters events that are still ongoing if 'endTimePast' flag is set
    var filterEvents = function(events, cb) {

      var now = new Date().getTime();

      if (!endTimePast) { return cb(null, events); }

      events = _.filter(
        events,
        function(event) {
          if (!event.end || event.end.date) { return true; }    // don't filter all day events
          return new Date(event.end.dateTime).getTime() < now;  // filter ongoing events
        }
      );
      cb(null,events);

    };

    dayRange = args.dayRange || 30;
    endTimePast = "endTimePast" in args ? args.endTimePast : false;
    d = new Date();
    endTime = d.toISOString();
    d.setUTCDate(d.getUTCDate() - dayRange);
    startTime = d.toISOString();

    getEvents(startTime, endTime, function(err, events) {
      if (err) { return cb(err, events); }
      filterEvents(events, cb);
    });

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
      responseHandler({ includeResult: true}, cb)
    );
  };

  this.submitNewEvent = function(event, cb) {
    // Submits new event.
    // callback is called with error and newly created event
    calendarClient.events.insert(
      calendarId,
      event,
      {},
      responseHandler({ includeResult: true }, cb)
    );
  };

  this.deleteEvent = function(eventId, cb) {
    calendarClient.events.delete(
      calendarId,
      eventId,
      {},
      responseHandler({}, cb)
    );
  };

}

module.exports = GoogleCalendar;
