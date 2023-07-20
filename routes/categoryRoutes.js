const express = require('express');
const categoryController = require('../controllers/categorysController');
const userController = require('../controllers/userController');
const authUserController = require('../controllers/authUserController');
const categoryModel = require('../models/categorieModel');

// mergeParams: true to get access to the params from the parent router (userRoutes) for the nested routes
const router = express.Router({ mergeParams: true });

router
  .route('/user/:userId')
  .get(
    userController.protect,
    authUserController.restrictToOwnerByUserId(
      categoryModel,
      'userId',
      'owner'
    ),
    categoryController.getAllCategoriesByUserId
  );

router
  .route('/')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    categoryController.getAllCategories
  )
  .post(
    userController.protect,
    authUserController.CreateOneVerification('userId', 'owner'),
    categoryController.setCategorieUserIds,
    categoryController.createCategorie
  );

router
  .route('/:id')
  .get(
    userController.protect,
    authUserController.restrictToOwner(categoryModel, 'userId', 'owner'),
    categoryController.getCategorieById
  )
  .patch(
    userController.protect,
    authUserController.restrictToOwner(categoryModel, 'userId', 'owner'),
    categoryController.updateCategorie
  )
  .delete(
    userController.protect,
    authUserController.restrictToOwner(categoryModel, 'userId', 'owner'),
    categoryController.deleteCategorie
  );

module.exports = router;
