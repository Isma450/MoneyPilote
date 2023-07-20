const express = require('express');

const generalController = require('../controllers/generalController');
const authUserController = require('../controllers/authUserController');
const userController = require('../controllers/userController');
const userModel = require('../models/userModel');
const categoryRoutes = require('./categoryRoutes');
const transacRoutes = require('./transacRoutes');
const goalRoutes = require('./goalRoutes');
const budgetRoutes = require('./budgetRoutes');

const router = express.Router();

//TODO nested routes with express createNew category , goal...
// (category) :
router.use('/:userId/categorie', categoryRoutes);
//(goals) :
router.use('/:userId/goal', goalRoutes);
// (transactions) :
router.use('/:userId/:categoryId/transaction', transacRoutes);
// (budgets) :
router.use('/:userId/:categoryId/budget', budgetRoutes);

//TODO authentification
router.route('/login').post(userController.loginIn);
router.route('/register').post(userController.signUp);

//TODO password reset & frogot & update password
router
  .route('/forgotPassword')
  .post(authUserController.forgotPassword(userModel));
router
  .route('/resetPassword/:token')
  .patch(authUserController.resetPassword(userModel));
router
  .route('/updateMyPassword')
  .patch(
    authUserController.protect(userModel),
    authUserController.updatePassword(userModel)
  );

// TODO get user logged in
router
  .route('/me')
  .get(
    authUserController.protect(userModel),
    userController.getMe,
    generalController.getOne(userModel)
  );
//TODO update me (user)
router
  .route('/updateMe')
  .patch(authUserController.protect(userModel), userController.updateMe);
//TODO delete me (user)
router
  .route('/deleteMe')
  .delete(authUserController.protect(userModel), userController.deleteMe);

// Check if user is logged in
router.route('/isLoggedIn').get(authUserController.isLoggedIn(userModel));
//TODO logout
router.route('/logout').get(authUserController.logout);

//TODO general routes
router
  .route('/')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    userController.getUsers
  )
  .post(
    userController.protect,
    authUserController.restrictTo('admin'),
    userController.CreatedUser
  );
router
  .route('/:id')
  .patch(
    userController.protect,
    authUserController.restrictTo('admin'),
    userController.updateUser
  )
  .delete(
    userController.protect,
    authUserController.restrictTo('admin'),
    userController.deleteUser
  );

module.exports = router;
