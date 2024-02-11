/*main controller */

const express = require('express');
const router = express.Router();
const User = require('./../models/user.js'); 
const extend = require('lodash/extend.js');
const errorHandler = require('./../../db/helpers/dbErrorHandler');
const formidable = require('formidable');
const fs = require('fs');
const profileImage = ('./../../../client/src/assets/images/profile-pic.jpg');

	/* create new user. */
	const create = async (req, res) => {
		const user = new User(req.body);
		let existing_user = await User.findOne({ "email": req.body.email });		
		if (existing_user){
			return res.status('401').json({ error: "User already exists" })
		}else{
			try {

				await user.save();
				return res.status(200).json({
					message: "Successfully signed up!"
				})
			} catch (err) {
				return res.status(400).json({
					error: errorHandler.getErrorMessage(err)
				})
			}
		}
	};
	
	
	const list = async (req, res) => {
		try {
			let users = await User.find().select('name email updated hashed_password created');
			res.json(users);
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			})
		}
	};	
	
	const userByID = async (req, res, next, id) => {
		try {
			let user = await User.findById(id);
			if (!user)
				return res.status(400).json({
					error: "User not found"
			})
			req.profile = user;
			next();
		} catch (err) {
			return res.status(400).json({
				error: "Could not retrieve user"
			})
		}
	};
	
	const read = (req, res) => {
		req.profile.hashed_password = undefined;
		return res.json(req.profile);
	};
	
	const update = async (req, res) => {
		let form = new formidable.IncomingForm();
		form.keepExtensions = true;
		form.parse(req, async (err, fields, files) => {
			if (err) {
				return res.status(400).json({
					error: "Photo could not be uploaded"
				})
			}			
			let id = req.profile._id;
			let user = await User.findById(id);
			user = extend(user, fields);
			user.updated = Date.now();
			if(files.photo){
				user.photo.data = fs.readFileSync(files.photo.path);
				user.photo.contentType = files.photo.type;
			}
			try {
				await user.save();
				return res.status(201).json({
					message: "Successfully updated user:" + id.toLocaleString()
				})
			} catch (err) {
				return res.status(400).json({
					error: errorHandler.getErrorMessage(err)
				})
			}
		});
	};
	
	const remove = async (req, res) => {
		try {
			let id = req.profile._id;				
			await User.findByIdAndDelete(id);
			return res.status(200).json({
					message: "Successfully deleted user:" + id.toLocaleString()
				})
		} catch (err) {
			return res.status(400).json({
				error: errorHandler.getErrorMessage(err)
			})
		}
	};
	
	const photo = (req, res, next) => {
		if(req.profile.photo.data){
			res.set("Content-Type", req.profile.photo.contentType);
			return res.send(req.profile.photo.data);
		}
	next();
	};
	
	const defaultPhoto = (req, res) => {
		return res.sendFile(process.cwd()+ profileImage);
	};
	
module.exports = {
	create,
	list,
	userByID,
	read,
	update,
	remove, 
	photo,
	defaultPhoto
};
