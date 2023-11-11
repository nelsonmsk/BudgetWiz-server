
	var config = {
		env: process.env.NODE_ENV || 'development',
		port: process.env.PORT || 3001,
		jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",
		mongoUri: process.env.MONGODB_URI || process.env.MONGO_HOST ||
			'mongodb://' + (process.env.IP || '127.0.0.1') + ':' +
			(process.env.MONGO_PORT || '27017') + '/budgetWiz'
	}
	
module.exports = config;
