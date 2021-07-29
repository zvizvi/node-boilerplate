module.exports = function (req, res, next) {
  res.jsonError = function (error, statusCode = 500) {
    console.error(error); // TODO: better logging
    res.status(statusCode).setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(
      { status: 'error', data: error.toString() },
      null,
      process.env.NODE_ENV === 'production' ? 0 : 2));
  };

  res.jsonSuccess = function (data, statusCode = 200) {
    res.status(statusCode).setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(
      { status: 'success', data: data },
      null,
      process.env.NODE_ENV === 'production' ? 0 : 2
    ));
  };

  res.resolve = function (promiseObject) {
    promiseObject
      .then(res.jsonSuccess)
      .catch(res.jsonError);
  };

  next();
};
