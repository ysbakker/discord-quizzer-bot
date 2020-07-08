const mongoose = require('mongoose');
require('./question');
const Question = mongoose.model('Question').schema;

const Questionnaire = new mongoose.Schema({
  categoryId: {
    type: Number
  },
  category: {
    type: String
  },
  questions: {
    type: [Question],
    default: []
  }
});

mongoose.model('Questionnaire', Questionnaire);
