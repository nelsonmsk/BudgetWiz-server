const bcrypt = require ('bcrypt');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Name is required'
	},
	about: {
		type: String,
		trim: true
	},
	email: {
		type: String,
		trim: true,
		unique: 'Email already exists',
		match: [/.+\@.+\..+/, 'Please fill a valid email address'],
		required: 'Email is required'
	},
	created: {
		type: Date,
		default: Date.now()
	},
	updated: Date,
	hashed_password: {
		type: String,
		required: "Password is required"
	},
	photo: {
		data: Buffer,
		contentType: String
	}
});

userSchema
	.virtual('password')
	.set(function(password) {
		this._password = password;
		this.hashed_password = this.encryptPassword(password);
	})
	.get(function() {
		return this._password;
	});

userSchema.methods = {
	authenticate: async function(plainText) {
		return await bcrypt.compare(plainText, this.hashed_password);
	},
	encryptPassword: function(password) {
		if (!password) return '';
		let saltRounds = 10;
			try {
				const hash = bcrypt.hashSync(password, saltRounds);
				return hash;
			} catch (err) {
				return '';
			}
	},
};

userSchema.path('hashed_password').validate(function(v) {
	if (this._password && this._password.length < 6) {
		this.invalidate('password', 'Password must be at least 6 characters.');
	}
	if (this.isNew && !this._password) {
		this.invalidate('password', 'Password is required');
	}
}, null);

const User = mongoose.model('User', userSchema);

module.exports = User;