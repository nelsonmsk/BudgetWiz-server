const express = require('express');
const router = express.Router();

const userCtrl = require('./../controllers/user');
const authCtrl = require('./../controllers/auth');

router.route('/api/users')
	.get(userCtrl.list)
	.post(userCtrl.create);
	
router.route('/api/users/:userId')
	.get(authCtrl.requireSignin, userCtrl.read)
	.put(authCtrl.requireSignin, authCtrl.hasAuthorization,userCtrl.update)
	.delete(authCtrl.requireSignin, authCtrl.hasAuthorization,userCtrl.remove);
	
router.param('userId', userCtrl.userByID);

router.route('/api/users/photo/:userId')
	.get(userCtrl.photo, userCtrl.defaultPhoto);
	
router.route('/api/users/defaultphoto')
	.get(userCtrl.defaultPhoto);
	
module.exports = router;
