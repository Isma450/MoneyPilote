// if an error is thrown in the async function, it will be caught by the catch block and passed to the next global error handling middleware in this case the errorController.js file (see above)
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
