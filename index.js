var EventEmitter = require('events').EventEmitter;
var CustomError = require('error-plus');
var Redis = require('redis');
var util = require('util');

function RedisQueueSizePoller(options, queueNames) {
  if (!(this instanceof RedisQueueSizePoller)) {
    return new RedisQueueSizePoller(options, queueNames);
  }

  this.pollInterval = options.pollInterval || 5000;
  this.redisClient = Redis.createClient(options.port || 6379,
    options.host || '127.0.0.1',
    { password: options.password });
  this.queueNames = queueNames;
  this.queueSizes = {};
  this.stopping = false;
  this.timerHandle = null;
  process.nextTick(this.pollQueueSizes.bind(this));
}

util.inherits(RedisQueueSizePoller, EventEmitter);

RedisQueueSizePoller.prototype.getQueueSizes = function () {
  return this.queueSizes;
};

RedisQueueSizePoller.prototype.pollQueueSizes = function () {
  var multi = this.redisClient.multi();
  this.queueNames.forEach(function (queueName) {
    multi.llen(queueName);
  });
  var self = this;
  multi.exec(function (err, sizes) {
    if (err) {
      self.emit(new CustomError(err, 'Error retrieving Redis queue sizes'));
      return;
    }
    self.queueNames.forEach(function (el, i) {
      self.queueSizes[el] = sizes[i];
    });
  });
  if (!this.stopping) {
    this.timerHandle = setTimeout(this.pollQueueSizes.bind(this), this.pollInterval);
  }
};

RedisQueueSizePoller.prototype.close = function (cb) {
  if (this.timerHandle) {
    clearTimeout(this.timerHandle);
  }
  this.stopping = true;
  this.redisClient.quit(cb);
};

module.exports = RedisQueueSizePoller;
