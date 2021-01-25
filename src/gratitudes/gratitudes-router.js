const path = require("path"),
  express = require("express"),
  xss = require("xss"),
  GratitudesService = require("./gratitudes-service"),
  gratitudesRouter = express.Router(),
  jsonParser = express.json();

const { requireAuth } = require("../middleware/jwt-auth.js");

const serializeGratitude = (gratitude) => ({
  id: gratitude.id,
  thankful_for: xss(gratitude.thankful_for),
  did_well: xss(gratitude.did_well),
  achieve: xss(gratitude.achieve),
  soc: xss(gratitude.soc),
  date_created: gratitude.date_created,
});

gratitudesRouter
  .route("/")
  .get(requireAuth, (req, res, next) => {
    const knexInstance = req.app.get("db");
    GratitudesService.getAllGratitudes(knexInstance, req.user.id)
      .then((gratitudes) => {
        res.json(gratitudes.map(serializeGratitude));
      })
      .catch(next);
  })
  .post(jsonParser, requireAuth, (req, res, next) => {
    const { thankful_for, did_well, achieve, soc } = req.body,
      newGratitude = { thankful_for, did_well, achieve, soc };

    for (const [key, value] of Object.entries(newGratitude)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` },
        });
      }
    }

    newGratitude.thankful_for = xss(newGratitude.thankful_for);
    newGratitude.did_well = xss(newGratitude.did_well);
    newGratitude.achieve = xss(newGratitude.achieve);
    newGratitude.soc = xss(newGratitude.soc);
    newGratitude.author_id = req.user.id;

    GratitudesService.insertGratitude(req.app.get("db"), newGratitude)
      .then((gratitude) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${gratitude.id}`))
          .json(serializeGratitude(gratitude));
      })
      .catch(next);
  });

gratitudesRouter
  .route("/:gratitude_id")
  .all((req, res, next) => {
    GratitudesService.getById(req.app.get("db"), req.params.gratitude_id)
      .then((gratitude) => {
        if (!gratitude) {
          return res.status(404).json({
            error: { message: "No matching gratitude..." },
          });
        }
        res.gratitude = gratitude;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeGratitude(res.gratitude));
  })
  .delete((req, res, next) => {
    GratitudesService.deleteGratitude(
      req.app.get("db"),
      req.params.gratitude_id
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { thankful_for, did_well, achieve, soc } = req.body,
      gratitudeToUpdate = { thankful_for, did_well, achieve, soc };

    const numberOfValues = Object.values(gratitudeToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: { message: "Body must contain data." },
      });

    GratitudesService.updateGratitude(
      req.app.get("db"),
      req.params.gratitude_id,
      gratitudeToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = gratitudesRouter;
