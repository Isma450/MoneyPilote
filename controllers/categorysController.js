const Category = require('../models/categorieModel');
const generalController = require('./generalController');

// get all categories by userId
exports.getAllCategoriesByUserId = generalController.getAllByUserId(Category);

// get all categories from the database
exports.getAllCategories = generalController.getAll(Category);

// get a category by id
exports.getCategorieById = generalController.getOne(Category);

// create a new category
exports.createCategorie = generalController.createOne(Category);

// update a category
exports.updateCategorie = generalController.updateOne(Category);

// delete a category
exports.deleteCategorie = generalController.deleteOne(Category);

// Allow nested routes function middleware
exports.setCategorieUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.userId) req.body.userId = req.params.userId;
  next();
};
