const express = require('express');
const router = express.Router();

const userCtrl = require('./../controllers/user');
const incomeCtrl = require('./../controllers/income');
const authCtrl = require('./../controllers/auth');

router.route('/api/incomes')
	.post(authCtrl.requireSignin, incomeCtrl.create)
	.get(authCtrl.requireSignin, incomeCtrl.listByUser);


router.route('/api/incomes/:incomeId')
	.put(authCtrl.requireSignin, incomeCtrl.hasAuthorization, incomeCtrl.update)
	.delete(authCtrl.requireSignin, incomeCtrl.hasAuthorization, incomeCtrl.remove);
	
router.param('incomeId', incomeCtrl.incomeByID);

router.route('/api/incomes/current/preview')
	.get(authCtrl.requireSignin, incomeCtrl.currentMonthPreview);
	
router.route('/api/incomes/by/category')
	.get(authCtrl.requireSignin, incomeCtrl.incomeByCategory);
	
router.route('/api/incomes/plot')
	.get(authCtrl.requireSignin, incomeCtrl.plotIncomes);

router.route('/api/incomes/yearly')
	.get(authCtrl.requireSignin, incomeCtrl.yearlyIncomes);

router.route('/api/incomes/category/averages')
	.get(authCtrl.requireSignin, incomeCtrl.averageCategories);

module.exports = router;
