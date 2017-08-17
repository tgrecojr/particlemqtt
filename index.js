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
    console.log("logged in to particle. getting token");
    token = data.body.access_token;
    console.log("token: " + token);
    particle.getEventStream({ deviceId: 'mine', auth: token }).then(function(stream) {
        stream.on('event', function(data) {
            if (data.name == 'humidity' || data.name == 'temperature'){
                console.log(getFriendlyNameForDevice(data.coreid) + ":" + data.name + ":" + data.data);
            }
          
        });
      });
  },
  function (err) {
    console.log('Could not log in.', err.body.error_description);
    process.exit(1);
  }
);


function publishTempToHomeAssistant (temperature) {  
      client.publish('my/temp', temperature)
  }

function getFriendlyNameForDevice(coreid){
    var friendlyName;
    switch (coreid) {
        case '2f0042000e51353338363333':
            friendlyName = "GARAGE";
            break;
        case '20002a000247343337373738':
            friendlyName = "BASEMENT";
            break;
        case '38002f000f47333439323539':
            friendlyName = "ATTIC";
            break;
        case '2b0026000647333530373233':
            friendlyName = "OUTSIDE";
            break;
    }
    return friendlyName;
}