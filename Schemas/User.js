var mongoose = require('mongoose'),
	bcrypt = require('bcrypt-nodejs'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	SALT_WORK_FACTOR = 10;	// Determines how many iteractions the salt goes through


var UserSchema = new Schema({
	ID: ObjectId,
	FirstName: { type: String, required: true, trim: true },
	LastName: { type: String, required: true, trim: true },
	Email: {type: String, required: true, trim: true, index: { unique: true, sparse: true} },
	Password: {type: String, required: true },
	Roles: [{ type: ObjectId, ref: 'Role' }]
});

UserSchema.virtual('FullName').get(function()
{
	return this.FirstName + ' ' + this.LastName;
});
UserSchema.virtual('FullName').set(function(name)
{
	var split = name.split(' ');
	this.FirstName = split[0];
	this.LastName = split[1];
});

UserSchema.pre('save', function(next)
{
	var user = this;

	if(!user.isModified('Password'))
		return next();

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt)
	{
		if(err)
			return next(err);

		bcrypt.hash(user.Password, salt, function(err, hash)
		{
			if(err)
				return next(err);

			user.Password = hash;
			next();
		});
	});
});

UserSchema.methods.ComparePassword = function(candidatePassword, callback)
{
	var user = this;
	bcrypt.compare(candidatePassword, user.Password, function(err, isMatch)
	{
		if(err)
			return callback(err);

		callback(null, isMatch);
	})
}

module.exports = UserSchema;
