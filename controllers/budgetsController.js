const budgetModel = require('../models/budgetModel');
const generalController = require('./generalController');

// get all budgets
exports.getAllBudgets = generalController.getAll(budgetModel);

// get a budget by id
exports.getBudgetById = generalController.getOne(budgetModel);

// Allow nested routes function middleware
exports.setBudgetUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.userId) req.body.userId = req.params.userId;
  if (!req.body.categoryId) req.body.categoryId = req.params.categoryId;
  next();
};

// create a new budget
exports.createBudget = generalController.createOne(budgetModel);

// update a budget
exports.updateBudget = generalController.updateOne(budgetModel);

// delete a budget
exports.deleteBudget = generalController.deleteOne(budgetModel);
