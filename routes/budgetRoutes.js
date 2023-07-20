const express = require('express');
const budgetsController = require('../controllers/budgetsController');
const userController = require('../controllers/userController');
const authUserController = require('../controllers/authUserController');
const budgetModel = require('../models/budgetModel');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    budgetsController.getAllBudgets
  )
  .post(
    userController.protect,
    authUserController.CreateOneVerification('userId', 'owner'),
    budgetsController.setBudgetUserIds,
    budgetsController.createBudget
  );

router
  .route('/:id')
  .get(
    userController.protect,
    authUserController.restrictToOwner(budgetModel, 'userId', 'owner'),
    budgetsController.getBudgetById
  )
  .patch(
    userController.protect,
    authUserController.restrictToOwner(budgetModel, 'userId', 'owner'),
    budgetsController.updateBudget
  )
  .delete(
    userController.protect,
    authUserController.restrictToOwner(budgetModel, 'userId', 'owner'),
    budgetsController.deleteBudget
  );

module.exports = router;
