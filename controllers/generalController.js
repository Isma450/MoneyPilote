const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// getAll by userId
exports.getAllByUserId = function (Modal, name) {
  return catchAsync(async (req, res, next) => {
    // Vérifiez si l'ID utilisateur est fourni
    if (!req.params.userId) {
      return next(new AppError(`No user ID provided`, 400));
    }

    // Cherchez tous les documents avec le userId spécifié
    name = await Modal.find({ userId: req.params.userId });

    // Si aucun document n'est trouvé, renvoyez une erreur
    if (name.length === 0) {
      return next(new AppError(`No documents found with that user ID`, 404));
    }

    // Sinon, renvoyez les documents
    res.status(200).json({
      status: 'success',
      results: name.length,
      data: {
        name,
      },
    });
  });
};

// TODO general section
exports.getAll = function (Modal, name) {
  return catchAsync(async (req, res, next) => {
    // EXECUTE QUERY & consume promise (imported from apiFeatures.js)
    const features = new APIFeatures(Modal.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    name = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: name.length,
      data: {
        name,
      },
    });
  });
};

exports.getOne = function (Modal, name) {
  return catchAsync(async (req, res, next) => {
    // findById method returns a single document (returns promise)
    // console.log('Requested ID:', req.params.id);
    name = await Modal.findById(req.params.id);
    // .populate('userId');

    if (!name) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        name,
      },
    });
  });
};

exports.createOne = function (Modal, name) {
  return catchAsync(async (req, res, next) => {
    // create & save a new user (document)
    name = await Modal.create(req.body);
    // send response
    res.status(201).json({
      status: 'success',
      data: {
        name,
      },
    });
  });
};

exports.updateOne = function (Modal, name) {
  return catchAsync(async (req, res, next) => {
    // findByIdAndUpdate method returns a single document updated (returns promise)
    name = await Modal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!name) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        name,
      },
    });
  });
};

// deleteOne is a function that returns a function
exports.deleteOne = function (Modal, name) {
  return catchAsync(async (req, res, next) => {
    // findByIdAndDelete method returns a single document deleted (returns promise)
    name = await Modal.findByIdAndDelete(req.params.id);

    if (!name) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};
