const userModel = require('../models/userModel');
const generalController = require('./generalController');
const authUserController = require('./authUserController');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// authentification
exports.loginIn = authUserController.login(userModel);
exports.signUp = authUserController.signup(userModel);

// general routes
// function that create a new user
exports.CreatedUser = generalController.getOne(userModel);
// get user logged in
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// get All users & protect routes
exports.getUsers = generalController.getAll(userModel);
exports.protect = authUserController.protect(userModel);

// udpate user
exports.updateUser = generalController.updateOne(userModel);
// update User data (loged in)
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user try's to update password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        `Cette route n'est pas destinée à la mise à jour des mots de passe. Veuillez utiliser /updateMyPassword à la place`,
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated(role , token , passwordChangedAt..) function top of the page (filterObj)
  const filteredBody = filterObj(req.body, 'username', 'email');

  //2) if not, update user document (filteredBody)
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// delete user
exports.deleteUser = generalController.deleteOne(userModel);
// delete user(loged in )
exports.deleteMe = catchAsync(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
