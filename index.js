var Particle = require('particle-api-js');
var mqtt = require('mqtt');
var config = require('config');

var mqtt_url = config.get('mqtt.url');
var options = {
    port: 1833,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: config.get('mqtt.username'),
    password: config.get('mqtt.password'),
  };

  


var particle = new Particle();
var token;

particle.login({username: config.get('particle.username'), password: config.get('particle.password')}).then(
  function(data) {
    token = data.body.access_token;
    var client = mqtt.connect(mqtt_url, options);
  },
  function (err) {
    console.log('Could not log in.', err.body.error_description);
    process.exit(1);
  }
);


function publishTempToHomeAssistant (temperature) {  
      client.publish('my/temp', temperature)
  }