const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  messengerId: 'number',
  listID: 'string',
  email: 'string',
  boardUrl: 'string',
  boardID: 'string',
  trelloID: 'string'
});

const User = new mongoose.model('User', userSchema);

module.exports = User;