var Particle = require('particle-api-js');
var mqtt = require('mqtt');
var config = require('config');
var moment = require('moment');

var vaultoptions = {
  apiVersion: 'v1',
  token: config.get('vault.token'), 
  endpoint: config.get('vault.endpoint') 
};


var particle = new Particle();
var vault = require("node-vault")(vaultoptions);

var particleuser;
var particlepassword;
var mqtturl;
var mqttuser;
var mqttpassword;
var mqttport;
var particletoken;
 
var getParticlePassword = getEncryptedValue('secret/data/particlemqtt/particle/password');
var getParticleUser = getEncryptedValue('secret/data/particlemqtt/particle/user');
var getMQTTPort = getEncryptedValue('secret/data/particlemqtt/mqtt/port')
var getMQTTUser = getEncryptedValue('secret/data/particlemqtt/mqtt/user');
var getMQTTPassword = getEncryptedValue('secret/data/particlemqtt/mqtt/password')
var getMQTTURL = getEncryptedValue('secret/data/particlemqtt/mqtt/url')

var mqttoptions = {
  port: mqttport,
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: mqttuser,
  password: mqttpassword 
};

var mqttclient = mqtt.connect(mqtturl,mqttoptions);
mqttclient.on('error', handleMqttError);

getParticlePassword
  .then(data => particlepassword = data)
  .then(data => getParticleUser)
  .then(data => particleuser = data)
  .then(data => getMQTTPort)
  .then(data => mqttport = data)
  .then(data => getMQTTUser)
  .then(data => mqttuser = data)
  .then(data => getMQTTPassword)
  .then(data => mqttpassword = data)
  .then(data => getMQTTURL)
  .then(data => mqtturl = data)
  .then(data => {
    particle.login({username: particleuser, password: particlepassword}).then(
      function(data) {
        logToConsole("logged in to particle. getting token");
        particletoken = data.body.access_token;
        logToConsole("token: " + particletoken);
        particle.getEventStream({ deviceId: 'mine', auth: particletoken }).then(function(stream) {
          stream.on('event', function(data) {
              if (data.name == 'humidity' || data.name == 'temperature'){
                  publishTempToHomeAssistant(getFriendlyNameForDevice(data.coreid),data.name,data.data);
              }          
          });
        });
      },
      function (err) {
        logToConsole('Could not log in.', err.body.error_description);
        process.exit(1);
      }
    )
  });

  
function logToConsole(data){
  console.log(moment().format('YYYY-MM-DD H:mm:ss'),data)
}

function getEncryptedValue(key){
  return new Promise((resolve, reject)=>{
    vault.read(key).then(v => {
      let parsed = JSON.parse(JSON.stringify(v))
      let myvalue = parsed.data.data.value
      resolve(myvalue)
    }).catch(e => console.error(e))
  
  });
}

function handleMqttError(data){
  logToConsole("MQTT ERROR: " + data);
  var lookForConnError = "ECONNREFUSED";
  var lookForAuthError = "Not authorized";
  if (data.toString().indexOf(lookForConnError) !== -1 || data.toString().indexOf(lookForAuthError) !== -1){
    logToConsole("shutting down -- can't get a connection to MQTT")
    mqttclient.end(); 
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

function publishTempToHomeAssistant (location,messageType,value) {  
  var topicName = 'home/' + location + '/' + messageType;
  mqttclient.publish(topicName, value,{'qos': 1, 'retain': true});
  logToConsole("published to: " + topicName + ":" + value) 
}