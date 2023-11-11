const mongoose = require('mongoose'); 
const config = require('./../config/index');

mongoose.connect(config.mongoUri, {useNewUrlParser:true, useUnifiedTopology:true});

mongoose.connection.on('connected', () => {
	console.log('Mongoose connected to ${config.mongoUri}');
});

mongoose.connection.on('error', () => {
	console.log('Mongoose connection error:  ${err}');
});

mongoose.connection.on('disconnected', () => {
	console.log('Mongoose disconnected');
});

const gracefulShutdown = (msg, callback) => {
	mongoose.connection.close( () => {
		console.log('Mongoose disconnected through  ${msg}');
		callback();
	});
};

process.on('SIGINT', () => {
	gracefulShutdown('app termination', () => {
		process.exit(0);
	});
});