const methodNotAllowed = (request, response) => {
  return response.status(405).send({
    message: request.t("errorMessages.methodNotAllowed"),
  });
};

module.exports = methodNotAllowed;
