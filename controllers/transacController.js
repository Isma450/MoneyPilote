const transactionModel = require('../models/transactionModel');
const generalController = require('./generalController');
const catchAsync = require('../utils/catchAsync');

// get all transactions by user id
exports.getAllTransacByUserId = generalController.getAll(transactionModel);

// get all transactions
exports.getAllTransac = generalController.getAll(transactionModel);

// get a transaction by id
exports.getTransacById = generalController.getOne(transactionModel);

// Allow nested routes function middleware
exports.setTransacUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.userId) req.body.userId = req.params.userId;
  if (!req.body.categoryId) req.body.categoryId = req.params.categoryId;
  console.log('setTransacUserIds passed');
  next();
};

// create a new transaction
exports.createTransac = generalController.createOne(transactionModel);

// update a transaction
exports.updateTransac = generalController.updateOne(transactionModel);

// delete a transaction
exports.deleteTransac = generalController.deleteOne(transactionModel);

// get transction stats(average, min, max, total) agregation pipeline
exports.getTransactionsStats = catchAsync(async (req, res, next) => {
  const stats = await transactionModel.aggregate([
    {
      $group: {
        _id: { $toUpper: '$type' },
        total: { $sum: '$amount' },
        moyenne: { $avg: '$amount' },
        min: { $min: '$amount' },
        max: { $max: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        total: 1,
        moyenne: { $round: ['$moyenne', 2] },
        min: 1,
        max: 1,
        count: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
