const mongoose = require('mongoose');
require('../../models/user');
const User = mongoose.model('User');

module.exports = {
  name: 'balance',
  aliases: ['b', 'bal'],
  category: 'economy',
  description: 'Displays your current balance.',
  run: async (client, message, args) => {
    const user = await User.findOne({ user: message.author.id });
    if (!user) return message.channel.send(`${message.author.username} hasn't played yet.`);
    return message.channel.send(`${message.author.username} has ${user.balance} coins.`);
  },
};
