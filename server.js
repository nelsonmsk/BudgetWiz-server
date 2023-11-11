const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const compress = require('compression');

const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require('./config/index');

const userRouter = require('./app_server/routes/user');
const authRouter = require('./app_server/routes/auth');
const expenseRouter = require('./app_server/routes/expense');
const incomeRouter = require('./app_server/routes/income');

const app = express();
 
require('./db/index');

app.set('port', config.port);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(helmet());
app.use(cors());
app.use(express.static(path.join(__dirname, 'client/build')));

app.use('/', userRouter);
app.use('/', authRouter);
app.use('/', expenseRouter);
app.use('/', incomeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development//
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

	if (err.name === 'UnauthorizedError') {
		res.status(401).json({"error" : err.name + ": " + err.message});
	}else if (err) {
		res.status(400).json({"error" : err.name + ": " + err.message});
		console.log(err);
	}  res.render('error');
});

function startServer() {
	http.createServer(app).listen(app.get('port'), function () {
	console.log('Express server listening on port '
	+ app.get('port'));
	});
}

if(require.main === module){
	// application run directly; start app server
	startServer();
} else {
	// application imported as a module via "require": export function
	// to create server
module.exports = startServer;
}


