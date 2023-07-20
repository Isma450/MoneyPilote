const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// mongoose schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Un compte doit avoir un nom d'utilisateur"],
    unique: true,
    trim: true,
    maxlength: [
      20,
      "Un nom d'utilisateur doit contenir au maximum 20 caractères",
    ],
    minlength: [
      3,
      "Un nom d'utilisateur doit contenir au minimum 3 caractères",
    ],
    validate: {
      validator: function (val) {
        return /^[a-zA-Z0-9]+$/.test(val);
      },
      message:
        "({VALUE}): n'est pas valide, veuillez entrer un nom d'utilisateur valide",
    },
  },
  email: {
    type: String,
    required: [true, 'Un compte doit avoir une adresse e-mail'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [
      50,
      'Une adresse e-mail doit contenir au maximum 50 caractères',
    ],
    minlength: [5, 'Une adresse e-mail doit contenir au minimum 5 caractères'],
    validate: {
      validator: function (val) {
        return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val);
      },
      message:
        "({VALUE}): n'est pas valide, veuillez entrer une adresse e-mail valide",
    },
  },
  password: {
    type: String,
    required: [true, 'Un compte doit avoir un mot de passe'],
    select: false,
    trim: true,
    minlength: [8, 'Un mot de passe doit contenir au minimum 8 caractères'],
    validate: {
      validator: function (val) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/.test(
          val
        );
      },
      message:
        "({VALUE}): n'est pas valide, veuillez entrer un mot de passe valide",
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'Veuillez confirmer votre mot de passe'],
    select: false,
    trim: true,
    minlength: [8, 'Un mot de passe doit contenir au minimum 8 caractères'],
    validate: [
      {
        validator: function (val) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/.test(
            val
          );
        },
        message:
          "({VALUE}): n'est pas valide, veuillez entrer un mot de passe valide",
      },
      {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Les mots de passe ne correspondent pas',
      },
    ],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  image: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['owner', 'admin'],
    default: 'owner',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

// Functions middlewares:

// mongoose pre save middleware to hash password
userSchema.pre('save', async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // hash password with cost of 12(not make it too easy to crack the password or too hard to make it slow 10 is the default)
  this.password = await bcrypt.hashSync(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

// mongoose pre save middleware to set passwordChangedAt property
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// mongoose pre find middleware to exclude inactive users
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// Functions methods instances:
// Instance method to compare the provided password with the hashed password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // compare the provided password with the hashed password using campare method from bcrypt (return true or false)
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance metohd to check if the user changed password after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // check if the password was changed after the token was issued
  if (this.passwordChangedAt) {
    // convert the passwordChangedAt to a timestamp
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // check if the password was changed after the token was issued
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// create password reset token
userSchema.methods.createPasswordResetToken = function () {
  // generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // encrypt the token using crypto
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  // set the password reset token expiration date
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // return the unencrypted token
  return resetToken;
};

//

// mongoose model
const Username = mongoose.model('Username', userSchema);

module.exports = Username;
