const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const mongoose = require('mongoose');
const User = require('./lib/User');
require("dotenv").config();
const Trello = require('./Trello');


const dbUrl = process.env.MONGO_CONNECTION_STRING;
const bot = new Telegraf(process.env.TELEGRAM_API_TOKEN);
const trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);

mongoose.connect(dbUrl, {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));



bot.start( ctx => {
  ctx.reply(
    `How can I help you, ${ctx.from.first_name}!\nI'm the TaskBot for Trello. Send me your email so we can begin our work!`
  );
  User.findOne({messengerId: ctx.from.id})
    .then(res => {
      if (res == null){
        User.create({messengerId: ctx.from.id});
      }
    })
});

bot.command('help', ctx => {
  ctx.reply(`I can do several things:
  1. Write me your email and I will create a new Trello board for you
  2. Write me any task you like and it will appear on the board
  3. Each task is assigned to your trello Account
  
  If you want to go to your board write '/board' to me`)
});

bot.command('board', async ctx => {
  let user = await User.findOne({ messengerId: ctx.from.id });
  if (!user.boardUrl) {
    return ctx.reply('Somehow I don\'t have your board yet. Did you send me your email?')
  }

  ctx.reply(
    'Some interesting tasks today?',
    Markup.inlineKeyboard([
      Markup.urlButton('Go to board', user.boardUrl),
    ]).extra()
  )
})

bot.hears(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/i, ctx => emailHandler(ctx));

bot.on('text', ctx => addTask(ctx));

bot.launch();


async function emailHandler (ctx) {
  let user = await User.findOne({messengerId: ctx.from.id});
  if (!user) return;
  if (user.email) {
    return ctx.reply(
      `You already have an email: ${user.email}`,
      Markup.inlineKeyboard([
        Markup.urlButton('Go to board', user.boardUrl),
      ]).extra()
      );
  }

  user = await User.findOne({email: ctx.message.text});

  if (user) {
    return ctx.reply('This email is already taken');
  }

  const board = await trello.createBoard();
  trello.addMember(ctx.message.text, board.data.id);

  const list = await trello.getLists(board.data.id);

  User.where({messengerId: ctx.from.id})
    .updateOne({
      email: ctx.message.text,
      listID: list.data[0].id,
      boardUrl: board.data.url,
      boardID: board.data.id
    })
    .exec();

  ctx.reply(
    'I\'ve added you to the Trello Board',

    Markup.inlineKeyboard([
      Markup.urlButton('Go to board', board.data.url),
    ]).extra()
    )

}

// Adding task to the user object tasks array
async function addTask (ctx) {

  const task = ctx.message.text;
  User.findOne({messengerId: ctx.from.id})
    .then( (user) =>  {
      
      if (!user.trelloID) {
        trello.getMembersFromBoard(user.boardID)
          .then( members => {
            trelloID = members.data[0].id == '5ca06438e82ffa35fc874de9'
              ? members.data[1].id : members.data[0].id;
              user.trelloID = trelloID;
              user.save(function (e) {
                console.log(e);
              });
          })
      }

      trello.addCard(task, null, user.listID)
        .then(res => {
          ctx.reply('The task has been added');
          trello.addMemberToCard(res.data.id, user.trelloID)
            .catch( e => console.log(e) );
        })

    })
    .catch(err => {
      ctx.reply('Some error occurred, try again.');
    });

}
