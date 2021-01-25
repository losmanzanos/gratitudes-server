const GratitudesService = {
  getAllGratitudes(knex, userId) {
    return knex.select("*").from("gratitudes").where("author_id", userId);
  },
  insertGratitude(knex, newGratitude) {
    return knex
      .insert(newGratitude)
      .into("gratitudes")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from("gratitudes").select("*").where({ id }).first();
  },

  deleteGratitude(knex, id) {
    return knex("gratitudes").where({ id }).delete();
  },

  updateGratitude(knex, id, newGratitudeFields) {
    return knex("gratitudes").where({ id }).update(newGratitudeFields);
  },
};

module.exports = GratitudesService;
