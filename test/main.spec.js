var GoogleCalendar = require('../index.js')
  , tools = require('./spec-tools.js')
  , fs = require('fs')
  , jsonfile = require('jsonfile')
  , async = require('async')
  , _ = require('underscore')
  , googleRefreshToken = require('google-refresh-token')
  , gcal = require('google-calendar')
  , config = null;

// a mock object to allow tests to run (and fail) even without credentials
var googleCalendar = new GoogleCalendar('foo', 'bar', 'baz', 'qux');

var insertSampleEvents = function(cb) {
  console.log('Inserting sample events - this may take a while...');
  var sampleEvents = tools.generateSampleData();
  async.eachLimit(sampleEvents, 15, googleCalendar.submitNewEvent, cb);
};

var deleteAllEvents = function(cb) {
  console.log('Deleting events from calendar - this may take a while...');
  var allEvents = [];
  async.waterfall([
      function(cb) {
        googleCalendar.getPastEvents(cb);
      },
      function(events, cb) {
        allEvents = events;
        googleCalendar.getFutureEvents(cb);
      },
      function(events, cb) {
        var deletedEvents = [];
        allEvents = allEvents.concat(events);
        async.eachLimit(
          allEvents,
          15,
          function(event, cb) {
            if (deletedEvents.indexOf(event.id) === -1) {
              deletedEvents.push(event.id);
              googleCalendar.deleteEvent(event.id, cb);
            }
            else {
              cb(null);
            }
          },
          cb);
      }
    ],
    cb);
};

beforeEach(function(done) {
  // get access tokens here
  config = config || jsonfile.readFileSync('./test/config.json');

  async.waterfall([
      function(cb) {
        // check validity of access token and refresh if necessary
        new gcal.GoogleCalendar(config.accessToken).calendarList.list(function(err) {
          if (err) {
            if (err.message.match(/invalid credentials/i)) {
              googleRefreshToken(config.refreshToken, config.clientId, config.clientSecret, function(err, body) {
                  if (!err) {
                    config.accessToken = body.accessToken;
                    jsonfile.writeFileSync('./test/config.json', config);
                  }
                  console.log(err);
                  cb(err);
                });
              }
            else {
              cb(new Error(err.message));
            }
          }
          else {
            cb(null);
          }
        });
      },
      function(cb) {
        googleCalendar = new GoogleCalendar(config.accessToken, config.clientId, config.clientSecret, config.calendarId);
        cb(null);
      }
    ],
    done);
}, 30000);

describe('getting events', function() {

  var sampleDataAdded = false
    , specCompleted = false;

  beforeEach(function(done) {
    if (!sampleDataAdded) {
      sampleDataAdded = true;
      async.waterfall([ deleteAllEvents, insertSampleEvents ], done);
    }
    else {
      done();
    }
  }, 30000);

  function expectLength(minLength, maxLength, done) {
    return function (err, events) {
      expect(events.length).toBeGreaterThan(minLength - 1);
      expect(events.length).toBeLessThan(maxLength + 1);
      done(err);
    };
  }

  describe('getPastEvents', function() {
    it('should get past events', function(done) {
      googleCalendar.getPastEvents(expectLength(7, 9, done));
    }, 15000);

    it('should accept argument "endTimePast"', function (done) {
      googleCalendar.getPastEvents({ endTimePast: true }, expectLength(6, 7, done));
    }, 15000);
  });

  describe('getFutureEvents', function() {
    it('should get future events', function (done) {
      googleCalendar.getFutureEvents(expectLength(3, 5, done));
    }, 15000);
  });

  describe('getEvents', function() {

    it('should get events of specific time range', function(done) {
      var d = new Date()
        , timeMin
        , timeMax;
      d.setUTCDate(d.getUTCDate() - 1);
      timeMin = d.toISOString();
      d.setUTCDate(d.getUTCDate() + 2);
      timeMax = d.toISOString();

      googleCalendar.getEvents(timeMin, timeMax, expectLength(6, 8, done));
    }, 15000);

  });

  it('should clean up', function(done) {
    console.log('Starting cleanup...');
    specCompleted = true;
    done();
  });


  afterEach(function(done) {
    if (specCompleted) {
      deleteAllEvents(done);
    }
    else {
      done();
    }
  }, 30000);
});

describe('submitting evens', function() {

  var startDate = new Date(Date.now() + 2 * 60 * 60 * 1000)
    , endDate = new Date(Date.now() + 4 * 60 * 60 * 1000)
    , testEvent = {
      summary: 'test event',
      start: {
        dateTime: startDate.toISOString()
      },
      end: {
        dateTime: endDate.toISOString()
      }
    };

  describe('method submitNewEvent', function() {

    it('should submit a new event', function(done) {

      async.waterfall([
          function(cb) {
            googleCalendar.submitNewEvent(testEvent, cb);
          },
          function(event, cb) {
            googleCalendar.getFutureEvents(cb);
          },
          function(events, cb) {
            expect(events.length).toBe(1);
            expect(events[0].summary).toBe(testEvent.summary);
            cb(null);
          }
        ],
        done);
    }, 15000);

  });

  describe('method submitModifiedEvent', function() {

    var modifiedEvent;

    it('should submit modified event', function(done) {

      async.waterfall([
          function(cb) {
            googleCalendar.submitNewEvent(testEvent, cb);
          },
          function(event, cb) {
            googleCalendar.getFutureEvents(cb);
          },
          function(events, cb) {
            expect(events.length).toBe(1);
            if (!events.length) { return cb(new Error('No events!')); }
            modifiedEvent = events[0];
            modifiedEvent.summary = 'modified test event';
            googleCalendar.submitModifiedEvent(modifiedEvent, cb);
          },
          function (event, cb) {
            googleCalendar.getFutureEvents(cb);
          },
          function(events, cb) {
            expect(events.length).toBe(1);
            expect(events[0].summary).toBe('modified test event');
            cb(null);
          }
        ],
        done);

    }, 15000);

    it('should be able to modify same event multiple times', function(done) {

      var currentEvent
        , counter = 0;

      async.waterfall([
          function(cb) {
            googleCalendar.submitNewEvent(testEvent, cb);
          },
          function(event, cb) {
            currentEvent = event;
            async.doWhilst(
              function (cb) {
                counter++;
                currentEvent.summary += 'foo';
                googleCalendar.submitModifiedEvent(currentEvent, cb);
              },
              function () {
                return counter < 3;
              },
              cb);
          },
          function(cb) {
            googleCalendar.getFutureEvents(cb);
          },
          function(events, cb) {
            expect(events.length).toBe(1);
            expect(events[0].summary).toBe('test eventfoofoofoo');
            cb(null);
          }
        ],
        done);

    }, 15000);

  });

  afterEach(deleteAllEvents, 15000);

});

describe('all methods', function() {

  it('should return an Error instance in case of error', function(done) {

    var now = new Date()
      , inTheFuture = new Date(new Date().setDate(now.getDate() + 2))
      , sampleEvent = { summary: 'foo', start: { date: now }, end: { date: now }};

    // for testing, create a client with bad access token
    var testClient = new GoogleCalendar('foo', 'bar', 'baz', 'qux');

    var errors = [];

    var logError = function(methodName, cb) {
      return function(error) {
        if (error) {
          errors.push({ method: methodName, error: error });
        }
        cb(null);
      };
    };
    async.waterfall([
        function(cb) {
          async.eachSeries(
            [ 'getPastEvents', 'getFutureEvents' ],
            function(methodName, cb) {
              testClient[methodName](logError(methodName, cb));
            },
            cb);
        },
        function(cb) {
          async.each(
            [ 'submitNewEvent', 'submitModifiedEvent', 'deleteEvent' ],
            function(methodName, cb) {
              testClient[methodName](sampleEvent, logError(methodName, cb));
            },
            cb);
        },
        function(cb) {
          testClient.getEvents(now.toISOString(), inTheFuture.toISOString(), logError('getEvents', cb));
        },
        function (cb) {
          expect(errors.length).toBeTruthy();
          _.each(errors, function(error) {
            expect(error.error instanceof Error).toBeTruthy();
            expect(typeof error.error.message).toBe('string');
          });
          cb(null);
        }
      ],
      done);

  }, 30000);

});
