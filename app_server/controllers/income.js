/*income controller */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Income = require('./../models/income.js'); 
const extend = require('lodash/extend');
const errorHandler = require('./../../db/helpers/dbErrorHandler');
const formidable = require('formidable');
const fs = require('fs');

	/* create new income. */
	const create = async (req, res) => {
		try {
			req.body.recorded_by = req.auth._id;
			const income = new Income(req.body);
			await income.save();
			return res.status(200).json({
				message: "Income recorded!"
			});
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	
	const listByUser = async (req, res) => {
		let firstDay = req.query.firstDay;
		let lastDay = req.query.lastDay;
		try {
			let incomes = await Income.find({'$and':[ {'received_on': { '$gte': firstDay, '$lte':lastDay }},
											{'recorded_by': req.auth._id }] }).sort('received_on')
										.populate('recorded_by', '_id name');
			res.json(incomes);
		} catch (err){
			console.log(err);
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const incomeByID = async (req, res, next, id) => {
		try {
			let income = await Income.findById(id).populate
							('recorded_by', '_id name').exec();
			if (!income)
				return res.status(400).json({
					error: "Income record not found"
				})
			req.income = income;
			next();
		} catch (err){
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	
	const hasAuthorization = (req, res, next) => {
		const authorized = req.income && req.auth &&
			req.income.recorded_by._id == req.auth._id;
		if (!(authorized)) {
			return res.status('403').json({
				error: "User is not authorized"
			});
		}
		next();
	};
	
	const read = (req, res) => {
		return res.json(req.income);
	};
	
	const update = async (req, res) => {
		try {
			let income = req.income;
			income = extend(income, req.body);
			income.updated = Date.now();
			await income.save();
			res.json(income);
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	
	const remove = async (req, res) => {
		try {
			let income = req.income;
			await Income.findByIdAndDelete(income._id);
			return res.status(200).json({
				message: "Income deleted!"
			});
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const currentMonthPreview = async (req, res) => {
		const date = new Date(), y = date.getFullYear(), m = date.getMonth();
		const firstDay = new Date(y, m, 1);
		const lastDay = new Date(y, m + 1, 0);
		const today = new Date();
			today.setUTCHours(0,0,0,0);
		const tomorrow = new Date();
			tomorrow.setUTCHours(0,0,0,0);
			tomorrow.setDate(tomorrow.getDate()+1);
		const yesterday = new Date();
			yesterday.setUTCHours(0,0,0,0);
			yesterday.setDate(yesterday.getDate()-1);
		try {
			/* ... Perform aggregation operations on the Income collection
					to compute current month's numbers ... */
			/* ... Send computed result in response ... */
			let currentPreview = await Income.aggregate([
											{ $facet: { month: [
												{ $match: { received_on: { $gte: firstDay, $lt: lastDay },
													recorded_by: new mongoose.Types.ObjectId(req.auth._id)}},
												{ $group: { _id: "currentMonth" , totalReceived: {$sum: "$amount"} }},
												],
												today: [
													{ $match: { received_on: { $gte: today, $lt: tomorrow },
														recorded_by: new mongoose.Types.ObjectId(req.auth._id) }},
													{ $group: { _id: "today" , totalReceived: {$sum: "$amount"} } },
												],
												yesterday: [
													{ $match: { received_on: { $gte: yesterday, $lt: today },
														recorded_by: new mongoose.Types.ObjectId(req.auth._id) }},
													{ $group: { _id: "yesterday" , totalReceived: {$sum: "$amount"} } },
												]
											}
				}]);
		let incomePreview = {month: currentPreview[0].month[0], today: currentPreview[0].today[0], yesterday: currentPreview[0].yesterday[0] };
		res.json(incomePreview);
		} catch (err){
			console.log(err);
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	
	const incomeByCategory = async (req, res) => {
		const date = new Date(), y = date.getFullYear(), m = date.getMonth()
		const firstDay = new Date(y, m, 1)
		const lastDay = new Date(y, m + 1, 0)
		try {
			let categoryMonthlyAvg = await Income.aggregate([
			/*... aggregation ... */
				[{ $facet: {
						average: [
							{ $match: { recorded_by: new mongoose.Types.ObjectId(req.auth._id) }},
								{ $group: { _id: {category: "$category", month: {$month: "$received_on"}},
									totalReceived: {$sum: "$amount"} } },
								{ $group: { _id: "$_id.category", avgSpent: { $avg: "$totalReceived"}}},
								{ $project: {_id: "$_id", value: {average: "$avgSpent"},
									}
								}
							],
						total: [
							{ $match: { received_on: { $gte: firstDay, $lte: lastDay },
									recorded_by: new mongoose.Types.ObjectId(req.auth._id) }},
								{ $group: { _id: "$category", totalReceived: {$sum: "$amount"} } },
								{ $project: {_id: "$_id", value: {total: "$totalReceived"},
									}
								}
							]
						}
					},
					{ $project: {overview: { $setUnion:['$average','$total'] },
						}
					},
					{ $unwind: '$overview' },
					{ $replaceRoot: { newRoot: "$overview" } },
					{ $group: { _id: "$_id", mergedValues: { $mergeObjects: "$value" } } }
				]])
			.exec();
			res.json(categoryMonthlyAvg);
		} catch (err) {
			console.log(err);
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const plotIncomes = async (req, res) => {
		const date = new Date(req.query.month), y = date.getFullYear(), m = date.getMonth();
		const firstDay = new Date(y, m, 1);
		const lastDay = new Date(y, m + 1, 0);
		try {
			let totalMonthly = await Income.aggregate( [
									{ $match: { received_on: { $gte : firstDay, $lt: lastDay },
												recorded_by: new mongoose.Types.ObjectId(req.auth._id) }},
										{ $project: {x: {$dayOfMonth: '$received_on'}, y: '$amount'}}
								]).exec();
			res.json(totalMonthly);
		} catch (err){
			console.log(err);
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const yearlyIncomes = async (req, res) => {
		const y = req.query.year;
		const firstDay = new Date(y, 0, 1);
		const lastDay = new Date(y, 12, 0);
		try {
			let totalMonthly = await Income.aggregate( [
										{ $match: { received_on: { $gte : firstDay, $lt: lastDay } }},
											{ $group: { _id: {$month: "$received_on"}, totalReceived: {$sum: "$amount"} } },
											{ $project: {x: '$_id', y: '$totalReceived'}}
									]).exec();
			res.json({monthTot:totalMonthly});
		} catch (err){
			console.log(err);
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	const averageCategories = async (req, res) => {
		const firstDay = new Date(req.query.firstDay);
		const lastDay = new Date(req.query.lastDay);
		try {
			let categoryMonthlyAvg = await Income.aggregate([
											{ $match : { received_on : { $gte : firstDay, $lte: lastDay },
													recorded_by: new mongoose.Types.ObjectId(req.auth._id)}},
												{ $group : { _id : {category: "$category"},
														totalReceived: {$sum: "$amount"} } },
												{ $group: { _id: "$_id.category", avgSpent:
													{ $avg: "$totalReceived"}}},
												{ $project: {x: '$_id', y: '$avgSpent'}}
									]).exec();
			res.json({monthAVG:categoryMonthlyAvg});
		} catch (err){
			console.log(err);
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			});
		}
	};
	
	
module.exports = {
	create,
	listByUser,
	incomeByID,
	hasAuthorization,
	read,
	update,
	remove,
	currentMonthPreview, 
	incomeByCategory,
	plotIncomes,
	yearlyIncomes,
	averageCategories
};
