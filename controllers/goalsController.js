const goalModel = require('../models/goalModel');
const generalController = require('./generalController');
const catchAsync = require('../utils/catchAsync');

// get all goals
exports.getAllGoals = generalController.getAll(goalModel);

// get a goal by id
exports.getGoalById = generalController.getOne(goalModel);

// create a new goal
exports.createGoal = generalController.createOne(goalModel);

// update a goal
exports.updateGoal = generalController.updateOne(goalModel);

// delete a goal
exports.deleteGoal = generalController.deleteOne(goalModel);

// // Allow nested routes function middleware
exports.setGoalUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.userId) req.body.userId = req.params.userId;
  next();
};

// get all goals stats by year
exports.getGoalsStats = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const stats = await goalModel.aggregate([
    {
      // select only the documents that match the condition
      $match: {
        targetDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // group the documents by the field targetDate
      $group: {
        //   _id: { $month: '$targetDate' },
        // _id: { $dayOfMonth: '$targetDate' },
        _id: { $year: '$targetDate' },
        totalGoals: { $sum: 1 },
        golasAmount: { $push: '$targetAmount' },
        description: { $push: '$description' },
      },
    },
    {
      $addFields: { year: '$_id' },
    },
    {
      $project: {
        _id: 0,
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
