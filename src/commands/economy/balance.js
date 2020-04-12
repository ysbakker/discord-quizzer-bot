const mongoose = require('mongoose');
require('../../models/user');
const User = mongoose.model('User');

module.exports = {
  name: 'balance',
  aliases: ['b', 'bal'],
  category: 'economy',
  description: 'Displays your current balance.',
  run: async (client, { author, channel }, args) => {
    const user = await User.findOne({ user: author.id });
    if (!user) return channel.send(`${author.username} hasn't played yet.`);
    return channel.send(`${author.username} has ${user.balance} coins.`);
  },
};
