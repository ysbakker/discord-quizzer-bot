const mongoose = require('mongoose');

const User = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

mongoose.model('User', User);
