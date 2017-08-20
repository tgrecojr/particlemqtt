var Particle = require('particle-api-js');
var mqtt = require('mqtt');
var config = require('config');

var options = {
    port: config.get('mqtt.port'),
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: config.get('mqtt.username'),
    password: config.get('mqtt.password') 
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
                publishTempToHomeAssistant(getFriendlyNameForDevice(data.coreid),data.name,data.data);
            }          
        });
      });
  },
  function (err) {
    console.log('Could not log in.', err.body.error_description);
    process.exit(1);
  }
);



function publishTempToHomeAssistant (location,messageType,value) {  
    mqttclient = mqtt.connect(config.get('mqtt.url'),options);
    mqttclient.on('error', handleMqttError);
    var topicName = 'home/' + location + '/' + messageType;
    mqttclient.publish(topicName, value);
    console.log("published to: " + topicName + ":" + value)
    mqttclient.end(); 
    
  }

  function handleMqttError(data){
      console.log("MQTT ERROR: " + data);
      var lookForConnError = "ECONNREFUSED";
      var lookForAuthError = "Not authorized";
      if (data.toString().indexOf(lookForConnError) !== -1 || data.toString().indexOf(lookForAuthError) !== -1){
        console.log("shutting down -- can't get a connection to MQTT")
        process.exit(1);
      }
  }

function getFriendlyNameForDevice(coreid){
    var friendlyName;
    switch (coreid) {
        case '2f0042000e51353338363333':
            friendlyName = "garage";
            break;
        case '20002a000247343337373738':
            friendlyName = "basement";
            break;
        case '38002f000f47333439323539':
            friendlyName = "attic";
            break;
        case '2b0026000647333530373233':
            friendlyName = "outside";
            break;
    }
    return friendlyName;
}