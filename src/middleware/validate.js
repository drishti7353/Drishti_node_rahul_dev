const Joi = require("joi");
const { pick } = require("lodash");

const validate = (schema) => (request, res, next) => {
  ////console.log(request.body);
  const validSchema = pick(schema, ["params", "query", "body"]);
  const object = pick(request, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: "key" } })
    .validate(object);

  if (error) {
    const { details } = error;
    const message = details
      .map((i) => i.message)
      .join(",")
      .replace(/"/g, "");
    // const messages = details.map((i) => {
    //   const label = i.context?.label || i.context?.key; // Fallback to the key if label is not available
    //   const translatedMessage = request.t(`validationErrorMessages.${label}`);
    //   return translatedMessage || i.message;
    // });

    return res.status(422).json({
      // message: messages.join(","),
      message: message,
    });
  }

  Object.assign(request, value);
  return next();
};

module.exports = validate;
