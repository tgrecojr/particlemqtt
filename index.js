var Particle = require('particle-api-js');
var mqtt = require('mqtt');

var mqtt_url = "mqtt://localhost";
var options = {
    port: 1833,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'username',
    password: 'password',
  };

  


var particle = new Particle();
var token;

particle.login({username: 'user@email.com', password: 'pass'}).then(
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