var RedisQueueSizePoller = require('../index');
var Redis = require('redis');
var test = require('tape');

var redis = Redis.createClient();
redis.flushall();

test('Poll time defaults to 5s', function (t) {
  var poller = new RedisQueueSizePoller({}, ['one', 'two', 'three']);
  t.equal(poller.pollInterval, 5000, 'Poll time should default to 5 seconds');
  poller.close();
  t.end();
});

test('Results contain the queue names', function (t) {
  var poller = new RedisQueueSizePoller({}, ['one', 'two', 'three']);
  setTimeout(function () {
    var sizes = poller.getQueueSizes();
    t.equal(sizes.one, 0, 'Contains all the queue names');
    t.equal(sizes.two, 0, 'Contains all the queue names');
    t.equal(sizes.three, 0, 'Contains all the queue names');
    poller.close();
    t.end();
  }, 500);
});

test('Returns correct queue sizes', function (t) {
  var poller = new RedisQueueSizePoller({}, ['wow1', 'wow2', 'wow3']);
  redis.multi()
    .rpush('wow1', '1')
    .rpush('wow1', '2')
    .rpush('wow1', '3')
    .rpush('wow1', '4')
    .rpush('wow2', '1')
    .rpush('wow2', '2')
    .rpush('wow3', '1')
    .rpush('wow3', '2')
    .rpush('wow3', '3')
    .exec(function (err, result) {
      setTimeout(function () {
        t.equal(err, null);
        t.equal(result.length, 9);
        var sizes = poller.getQueueSizes();
        t.equal(sizes.wow1, 4, 'Queue sizes are correct');
        t.equal(sizes.wow2, 2, 'Queue sizes are correct');
        t.equal(sizes.wow3, 3, 'Queue sizes are correct');
        poller.close();
        redis.quit();
        t.end();
      }, 5000);
    });
});
