const knex = require("knex");
const fixtures = require("./gratitudes-fixture");
const app = require("../src/app");

describe("Gratitudes Endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => db("gratitudes").truncate());

  afterEach("cleanup", () => db("gratitudes").truncate());

  describe(`Unauthorized requests`, () => {
    const testGratitudes = fixtures.makeGratitudesArray();

    beforeEach("insert gratitudes", () => {
      return db.into("gratitudes").insert(testGratitudes);
    });

    it(`responds with 401 Unauthorized for GET /api/gratitudes`, () => {
      return supertest(app)
        .get("/api/gratitudes")
        .expect(401, { error: "Unauthorized request" });
    });

    it(`responds with 401 Unauthorized for POST /api/gratitudes`, () => {
      return supertest(app)
        .post("/api/gratitudes")
        .send({ title: "test-title", url: "http://some.thing.com", rating: 1 })
        .expect(401, { error: "Unauthorized request" });
    });

    it(`responds with 401 Unauthorized for GET /api/gratitudes/:id`, () => {
      const secondGratitude = testGratitudes[1];
      return supertest(app)
        .get(`/api/gratitudes/${secondGratitude.id}`)
        .expect(401, { error: "Unauthorized request" });
    });

    it(`responds with 401 Unauthorized for DELETE /api/gratitudes/:id`, () => {
      const aGratitude = testGratitudes[1];
      return supertest(app)
        .delete(`/api/gratitudes/${aGratitude.id}`)
        .expect(401, { error: "Unauthorized request" });
    });

    it(`responds with 401 Unauthorized for PATCH /api/gratitudes/:id`, () => {
      const aGratitude = testGratitudes[1];
      return supertest(app)
        .patch(`/api/gratitudes/${aGratitude.id}`)
        .send({ title: "updated-title" })
        .expect(401, { error: "Unauthorized request" });
    });
  });

  describe("GET /api/gratitudes", () => {
    context(`Given no gratitudes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/api/gratitudes")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given there are gratitudes in the database", () => {
      const testGratitudes = fixtures.makeGratitudesArray();

      beforeEach("insert gratitudes", () => {
        return db.into("gratitudes").insert(testGratitudes);
      });

      it("gets the gratitudes from the store", () => {
        return supertest(app)
          .get("/api/gratitudes")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testGratitudes);
      });
    });

    context(`Given an XSS attack gratitude`, () => {
      const {
        maliciousgratitude,
        expectedgratitude,
      } = fixtures.makeMaliciousGratitude();

      beforeEach("insert malicious gratitude", () => {
        return db.into("gratitudes").insert([maliciousGratitude]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/gratitudes`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body[0].title).to.eql(expectedGratitude.title);
            expect(res.body[0].description).to.eql(
              expectedGratitude.description
            );
          });
      });
    });
  });

  describe("GET /api/gratitudes/:id", () => {
    context(`Given no gratitudes`, () => {
      it(`responds 404 whe gratitude doesn't exist`, () => {
        return supertest(app)
          .get(`/api/gratitudes/123`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `gratitude Not Found` },
          });
      });
    });

    context("Given there are gratitudes in the database", () => {
      const testGratitudes = fixtures.makeGratitudesArray();

      beforeEach("insert gratitudes", () => {
        return db.into("gratitudes").insert(testGratitudes);
      });

      it("responds with 200 and the specified gratitude", () => {
        const gratitudeId = 2;
        const expectedGratitude = testGratitudes[gratitudeId - 1];
        return supertest(app)
          .get(`/api/gratitudes/${gratitudeId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedGratitude);
      });
    });

    context(`Given an XSS attack gratitude`, () => {
      const {
        maliciousGratitude,
        expectedGratitude,
      } = fixtures.makeMaliciousGratitude();

      beforeEach("insert malicious gratitude", () => {
        return db.into("gratitudes").insert([maliciousGratitude]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/gratitudes/${maliciousGratitude.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedGratitude.title);
            expect(res.body.description).to.eql(expectedGratitude.description);
          });
      });
    });
  });

  describe("DELETE /api/gratitudes/:id", () => {
    context(`Given no gratitudes`, () => {
      it(`responds 404 whe gratitude doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/gratitudes/123`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `gratitude Not Found` },
          });
      });
    });

    context("Given there are gratitudes in the database", () => {
      const testGratitudes = fixtures.makeGratitudesArray();

      beforeEach("insert gratitudes", () => {
        return db.into("gratitudes").insert(testGratitudes);
      });

      it("removes the gratitude by ID from the store", () => {
        const idToRemove = 2;
        const expectedGratitudes = testGratitudes.filter(
          (bm) => bm.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/gratitudes/${idToRemove}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/gratitudes`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedGratitudes)
          );
      });
    });
  });

  describe("POST /api/gratitudes", () => {
    ["title", "url", "rating"].forEach((field) => {
      const newgratitude = {
        title: "test-title",
        url: "https://test.com",
        rating: 2,
      };

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newGratitude[field];

        return supertest(app)
          .post(`/api/gratitudes`)
          .send(newgratitude)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'${field}' is required` },
          });
      });
    });

    it("adds a new gratitude to the store", () => {
      const newGratitude = {
        title: "test-title",
        url: "https://test.com",
        description: "test description",
        rating: 1,
      };
      return supertest(app)
        .post(`/api/gratitudes`)
        .send(newGratitude)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newGratitude.title);
          expect(res.body.url).to.eql(newGratitude.url);
          expect(res.body.description).to.eql(newGratitude.description);
          expect(res.body.rating).to.eql(newGratitude.rating);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/gratitudes/${res.body.id}`);
        })
        .then((res) =>
          supertest(app)
            .get(`/api/gratitudes/${res.body.id}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        );
    });

    it("removes XSS attack content from response", () => {
      const {
        maliciousGratitude,
        expectedGratitude,
      } = fixtures.makeMaliciousGratitude();
      return supertest(app)
        .post(`/api/gratitudes`)
        .send(maliciousGratitude)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(expectedGratitude.title);
          expect(res.body.description).to.eql(expectedGratitude.description);
        });
    });
  });

  describe(`PATCH /api/gratitudes/:gratitude_id`, () => {
    context(`Given no gratitudes`, () => {
      it(`responds with 404`, () => {
        const gratitudeId = 123456;
        return supertest(app)
          .patch(`/api/gratitudes/${gratitudeId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `gratitude Not Found` } });
      });
    });

    context("Given there are gratitudes in the database", () => {
      const testGratitudes = fixtures.makeGratitudesArray();

      beforeEach("insert gratitudes", () => {
        return db.into("gratitudes").insert(testGratitudes);
      });

      it("responds with 204 and updates the gratitude", () => {
        const idToUpdate = 2;
        const updateGratitude = {
          title: "updated gratitude title",
          url: "https://updated-url.com",
          description: "updated gratitude description",
          rating: 1,
        };
        const expectedGratitude = {
          ...testGratitudes[idToUpdate - 1],
          ...updateGratitude,
        };
        return supertest(app)
          .patch(`/api/gratitudes/${idToUpdate}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send(updateGratitude)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/gratitudes/${idToUpdate}`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedGratitude)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/gratitudes/${idToUpdate}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message: `Request body must content either 'title', 'url', 'description' or 'rating'`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateGratitude = {
          title: "updated gratitude title",
        };
        const expectedGratitude = {
          ...testGratitudes[idToUpdate - 1],
          ...updateGratitude,
        };

        return supertest(app)
          .patch(`/api/gratitudes/${idToUpdate}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateGratitude,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/gratitudes/${idToUpdate}`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedGratitude)
          );
      });
    });
  });
});
