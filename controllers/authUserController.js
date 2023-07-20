const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const Category = require('../models/categorieModel');

// TODO user section USER

// function that creates the token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// function that creates and sends the token to the client
const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;

  // this cookie will be sent to the client and will be used to access the protected routes
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// user signup function that will be used in the userRoutes
exports.signup = function (Modal, newUser) {
  return catchAsync(async (req, res, next) => {
    // important for security reasons
    // with this method we allow the data that we need to be put in the to the new user
    newUser = await Modal.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      role: req.body.role,
      //   passwordChangedAt: req.body.passwordChangedAt,
    });

    // Creating default categories for new user
    const defaultCategories = [
      'Dépenses courantes',
      'Divertissement',
      'Alimentation',
      'Santé et bien-être',
      'Transport',
      'Loisirs',
      'Épargne et investissement ',
      'Remboursement de dettes',
      'Autres',
    ];

    // Map over the array and return a promise for each create() operation
    const categoryPromises = defaultCategories.map((category) =>
      Category.create({
        name: category,
        userId: newUser._id,
      })
    );

    // Wait for all promises to resolve
    await Promise.all(categoryPromises);

    // this token will be sent to the client and will be used to access the protected routes
    createAndSendToken(newUser, 201, res);
  });
};

// user login function that will be used in the userRoutes
exports.login = function (Modal) {
  return catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) check if email and password exist
    if (!email || !password) {
      return next(
        new AppError('Veuillez fournir un e-mail et un mot de passe', 400)
      );
    }

    // 2) check if user exists
    const user = await Modal.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('E-mail ou mot de passe incorrect', 401));
    }

    // 3) check if password is correct (middleware in userModel)
    if (!(await user.correctPassword(password, user.password))) {
      return next(new AppError('E-mail ou mot de passe incorrect', 401));
    }

    // 4) if everything ok, send token to client
    createAndSendToken(user, 200, res);
  });
};

//TODO Protecting routes (used in the userRoutes before the getMe function)
exports.protect = function (Modal) {
  return catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          "Vous n'êtes pas connecté. Veuillez vous connecter pour accéder à cette page",
          401
        )
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists (not deleted)
    const currentUser = await Modal.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError(
          "L'utilisateur lié à ce token n'existe plus. Veuillez vous reconnecter",
          401
        )
      );
    }
    // 4) Check if user changed password after the token was issued
    // middlware in userModel
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'Le mot de passe a été modifié récemment. Veuillez vous reconnecter',
          401
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  });
};

//TODO this function will be used to check if the user is logged in or not (Only for rendered pages, no errors!)
exports.isLoggedIn = function (Modal) {
  return catchAsync(async (req, res, next) => {
    if (req.cookies.jwt) {
      // 1) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists (not deleted)
      const currentUser = await Modal.findById(decoded.id);

      if (!currentUser) {
        return res.status(200).json({ isLoggedIn: false, token: null });
      }

      // 3) Check if user changed password after the token was issued
      // middleware in userModel
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return res.status(200).json({ isLoggedIn: false, token: null });
      }

      // There is a logged in user
      res.locals.user = currentUser;

      return res.status(200).json({ isLoggedIn: true, token: req.cookies.jwt });
    }

    return res.status(200).json({ isLoggedIn: false, token: null });
  });
};

// TODO this function will delete the cookie when the user is logged out
exports.logout = function (req, res, next) {
  // Delete the JWT cookie
  res.clearCookie('jwt');
  return res.status(200).json({ isLoggedIn: false, token: null });
};

// TODO user section ADMIN verification

// function that will be used in the userRoutes to restrict the access by roles
exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    //roles ['owner', 'admin'] role='owner'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Vous n'avez pas la permission de faire cela", 403)
      );
    }
    next();
  };
};

// function that will be used in the userRoutes to restrict the access by owner
exports.restrictToOwner = function (Model, foreignKey, ...roles) {
  return catchAsync(async (req, res, next) => {
    //roles ['owner', 'admin'] role='owner'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Vous n'avez pas la permission de faire cela", 403)
      );
    }

    const resourceId = req.params.id;
    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(new AppError('Aucun user est trouvée avec cet ID', 404));
    }

    if (!resource[foreignKey].equals(req.user._id)) {
      return next(
        new AppError(
          "Vous n'avez pas la permission d'effectuer cette action",
          403
        )
      );
    }

    next();
  });
};

exports.restrictToOwnerByUserId = function (Model, foreignKey, ...roles) {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Vous n'avez pas la permission de faire cela", 403)
      );
    }

    const { userId } = req.params; // Changed to userId
    const resources = await Model.find({ userId: userId }); // Changed to find by userId

    if (resources.length === 0) {
      return next(new AppError('Aucune ressource trouvée avec cet ID', 404));
    }

    // Assuming all resources belong to the same user
    if (!resources[0][foreignKey].equals(req.user._id)) {
      return next(
        new AppError(
          "Vous n'avez pas la permission d'effectuer cette action",
          403
        )
      );
    }

    next();
  });
};

// create new category , goal , budget , transaction. user verification
exports.CreateOneVerification = function (foreignKey, ...roles) {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }
    //roles ['owner', 'admin'] role='owner'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Vous n'avez pas la permission de faire cela", 403)
      );
    }

    const userIdToCheck =
      req.body[foreignKey] || req.params[foreignKey] || foreignKey;

    if (String(userIdToCheck) !== String(req.user._id)) {
      return next(
        new AppError(
          "Vous n'avez pas la permission d'effectuer cette action",
          403
        )
      );
    }
    next();
  });
};

// TODO hundling password reset

// function that will be used in the userRoutes to reset the password
exports.forgotPassword = (Modal) => async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await Modal.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('Aucun utilisateur trouvé avec cette adresse e-mail', 404)
    );
  }
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Avez-vous oublié votre mot de passe? Soumettez une requête PATCH avec votre nouveau mot de passe et le mot de passe de confirmation à: ${resetURL}. Si vous n'avez pas oublié votre mot de passe, veuillez ignorer cet e-mail!`;

  try {
    await sendEmail({
      email: user.email,
      subject:
        'Votre lien de réinitialisation de mot de passe (valable 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token envoyé à votre adresse e-mail!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Impossible d envoyer l e-mail', 500));
  }
};

exports.resetPassword = (Modal) =>
  catchAsync(async (req, res, next) => {
    //1) Get user based on the token & check if token has not expired
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await Modal.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    //2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token invalide ou expiré', 400));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //3) Update changedPasswordAt property for the user
    //4) Log the user in, send JWT
    createAndSendToken(user, 200, res);
  });

// function that will be used in the userRoutes to update the password

// TODO manipulate user data

exports.updatePassword = (Modal) =>
  catchAsync(async (req, res, next) => {
    //1) Get user from collection
    const user = await Modal.findById(req.user.id).select('+password');

    //2) Check if POSTed current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Votre mot de passe actuel est incorrect', 401));
    }

    //3) If so, update password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();
    //4) Log user in, send JWT
    createAndSendToken(user, 200, res);
  });
