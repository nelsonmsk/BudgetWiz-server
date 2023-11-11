const express = require('express');
const router = express.Router();

const authCtrl = require('./../controllers/auth');

router.route('/auth/signin')
	.post(authCtrl.signin);
	
router.route('/auth/signout')
	.get(authCtrl.signout);

module.exports = router;
