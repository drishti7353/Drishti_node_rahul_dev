const i18Next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");
const path = require("path");

const localesPath = path.join(
  __dirname,
  "./../locales/{{lng}}/translation.json"
);

i18Next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: localesPath,
    },
    fallbackLng: "en",
    preload: ["en", "fr"],
  });

module.exports = i18Next;
