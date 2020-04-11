const mongoose = require('mongoose');
require('./questionnaire');

const Questionnaire = mongoose.model('Questionnaire').schema;

const User = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  questionnaires: {
    type: [Questionnaire],
    default: [],
  },
  active_questionnaire: {
    type: Number,
  },
});

mongoose.model('User', User);
