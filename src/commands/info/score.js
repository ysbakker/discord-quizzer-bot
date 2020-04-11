const mongoose = require('mongoose');
require('../../models/user');
const User = mongoose.model('User');

module.exports = {
  name: 'punten',
  aliases: ['p'],
  category: 'info',
  description: 'Check your score!',
  run: async (client, message, args) => {
    const user = await User.findOne({ user: message.author.id });
    if (!user) return message.reply('je moet wel eerst gespeeld hebben hea');
    return message.reply(`je hebt ${user.score} punten.`);
  },
};
