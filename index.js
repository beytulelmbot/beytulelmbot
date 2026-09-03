const { Telegraf, Markup } = require('telegraf');
// firebase-admin v12+ ላይ አዲሱ import አጻጻፍ፡
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
// Firebase Initialization
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    'ሰላም! ወደ ቤተ-እልም እንኳን ደህና መጡ። እባክዎ ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ፡',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📋 ሬጅስትሬሽን (Registration)', 'https://beytulelmbot.netlify.app/register')],
      [Markup.button.callback('📞 ሪሰፕሽን (Reception)', 'reception'), Markup.button.callback('ℹ️ ስለ እኛ', 'about')],
      [Markup.button.callback('❓ እርዳታ', 'help')]
    ])
  );
});

bot.on('web-app-data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);

    await db.collection('students').add({
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      course: data.course,
      telegramId: ctx.from.id,
      registeredAt: new Date() // registerdAt የሚለውን የፊደል ስህተት አስተካክለውታል
    });

    // የተስተካከለ Backtick (`) አጠቃቀም ለ Template Literal
    await ctx.reply(`Dear ${data.fullName}, you have registered successfully. Congratulations on joining Beytul-Elm!`);
  } catch (error) {
    console.error('Firestore Error: ', error);
    await ctx.reply('Sorry, could not register at the moment. Please try again!');
  }
});

// የሪሰፕሽን (Reception) አገልግሎት

bot.action('reception', (ctx) => {
  ctx.reply('እንኳን ወደ ሪሰፕሽን በሰላም መጡ። ማንኛውንም ጥያቄዎን ወይም አስተያየትዎን መጻፍ ይችላሉ፣ ሃላፊዎቻችን ምላሽ ይሰጡዎታል።');
});
// ስለ እኛ
bot.action('about', (ctx) => {
  ctx.reply('ይህ ቦት ለተጠቃሚዎች የተዘጋጀ የሪሰፕሽን እና የሬጅስትሬሽን አገልግሎት መስጫ ነው።');
});

bot.action('help', (ctx) => {
  ctx.reply('እርዳታ ከፈለጉ ከታች ያሉትን ቁልፎች በመጠቀም ማግኘት ይችላሉ።');
});
bot.launch();
console.log('ቦቱ ሜኑ እና ሲስተም ይዞ በመስራት ላይ ነው...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Render Port እንዲያገኝ የሚያደርግ Dummy Server
const http = require('http');
const port = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Beytul Elm Bot is running fine!\n');
}).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});