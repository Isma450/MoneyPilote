const express = require('express');
const goalsController = require('../controllers/goalsController');
const userController = require('../controllers/userController');
const authUserController = require('../controllers/authUserController');
const goalModel = require('../models/goalModel');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    goalsController.getAllGoals
  )
  .post(
    userController.protect,
    authUserController.CreateOneVerification('userId', 'owner'),
    goalsController.setGoalUserIds,
    goalsController.createGoal
  );

router
  .route('/:id')
  .get(
    userController.protect,
    authUserController.restrictToOwner(goalModel, 'userId', 'owner'),
    goalsController.getGoalById
  )
  .patch(
    userController.protect,
    authUserController.restrictToOwner(goalModel, 'userId', 'owner'),
    goalsController.updateGoal
  )
  .delete(
    userController.protect,
    authUserController.restrictToOwner(goalModel, 'userId', 'owner'),
    goalsController.deleteGoal
  );

// FIXME : make it available for a specific user (not only admin)
router
  .route('/stats/:year')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    goalsController.getGoalsStats
  );

module.exports = router;
