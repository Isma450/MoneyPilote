const express = require('express');
const transacController = require('../controllers/transacController');
const userController = require('../controllers/userController');
const authUserController = require('../controllers/authUserController');
const transactionModel = require('../models/transactionModel');

const router = express.Router({ mergeParams: true });

// get all transactions by user id
router
  .route('/user/:userId')
  .get(
    userController.protect,
    authUserController.restrictToOwnerByUserId(
      transactionModel,
      'userId',
      'owner'
    ),
    transacController.getAllTransacByUserId
  );

// FIXME : make it available for a specific user (not only admin)
router
  .route('/stats')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    transacController.getTransactionsStats
  );

router
  .route('/')
  .get(
    userController.protect,
    authUserController.restrictTo('admin'),
    transacController.getAllTransac
  )
  .post(
    userController.protect,
    authUserController.CreateOneVerification('userId', 'owner'),
    transacController.setTransacUserIds,
    transacController.createTransac
  );

// transaction routes & permissions
router
  .route('/:id')
  .get(
    userController.protect,
    authUserController.restrictToOwner(transactionModel, 'userId', 'owner'),
    transacController.getTransacById
  )
  .patch(
    userController.protect,
    authUserController.restrictToOwner(transactionModel, 'userId', 'owner'),
    transacController.updateTransac
  )
  .delete(
    userController.protect,
    authUserController.restrictToOwner(transactionModel, 'userId', 'owner'),
    transacController.deleteTransac
  );

module.exports = router;
