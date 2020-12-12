const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 
const userSchema = new Schema({
  name: String,
  username: String,
  password: String,
  description: String,
  image: String,
});

module.exports = User = mongoose.model("user", userSchema);