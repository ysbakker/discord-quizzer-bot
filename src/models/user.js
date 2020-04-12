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
  activeQuestionnaire: {
    type: Number,
  },
  questionsAsked: {
    type: Number,
    default: 0,
  },
  questionsCorrect: {
    type: Number,
    default: 0,
  },
});

mongoose.model('User', User);
