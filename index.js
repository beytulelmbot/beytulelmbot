const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8564018455:AAFChgRTBVku5I7tjUmzuyP6ViiSqcOg3z8');

// ተጠቃሚው /start ሲል ዋናውን ሜኑ ማሳየት
bot.start((ctx) => {
  ctx.reply(
    'ሰላም! ወደ ቤተ-እልም እንኳን ደህና መጡ። እባክዎ ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ፡',
    Markup.keyboard([
      ['📋 ሬጅስትሬሽን (Registration)', '📞 ሪሰፕሽን (Reception)'],
      ['ℹ️ ስለ እኛ', '❓ እርዳታ']
    ]).resize()
  );
});--
// የሪሰፕሽን (Reception) አገልግሎት
bot.hears('📞 ሪሰፕሽን (Reception)', (ctx) => {
  ctx.reply('እንኳን ወደ ሪሰፕሽን በሰላም መጡ። ማንኛውንም ጥያቄዎን ወይም አስተያየትዎን መጻፍ ይችላሉ፣ ሃላፊዎቻችን ምላሽ ይሰጡዎታል።');
});

// የሬጅስትሬሽን (Registration) አገልግሎት
bot.hears('📋 ሬጅስትሬሽን (Registration)', (ctx) => {
  ctx.reply('ለመመዝገብ እባክዎ ሙሉ ስምዎን (Full Name) በዚህ መልኩ ይጻፉ:\n\n`ምዝገባ ስምዎ` (ለምሳሌ: ምዝገባ አህመድ ከማል)', { parse_mode: 'Markdown' });
});

// ተጠቃሚው 'ምዝገባ' ብሎ ከጀመረ መረጃውን መቀበል
bot.on('text', (ctx) => {
  const text = ctx.message.text;
  
  if (text.startsWith('ምዝገባ')) {
    const name = text.replace('ምዝገባ', '').trim();
    if (name) {
      ctx.reply(`አመሰግናለን ውድ ${name}! ምዝገባዎ በትክክል ተመዝግቧል።`);
    } else {
      ctx.reply('እባክዎ ስምዎን ከ "ምዝገባ" ቀጥሎ በትክክል ይጻፉ።');
    }
  } else if (text === 'ℹ️ ስለ እኛ') {
    ctx.reply('ይህ ቦት ለተጠቃሚዎች የተዘጋጀ የሪሰፕሽን እና የሬጅስትሬሽን አገልግሎት መስጫ ነው።');
  } else if (text === '❓ እርዳታ') {
    ctx.reply('እርዳታ ከፈለጉ ከታች ያሉትን ቁልፎች በመጠቀም ማግኘት ይችላሉ።');
  }
});

bot.launch();
console.log('ቦቱ ሜኑ እና ሲስተም ይዞ በመስራት ላይ ነው...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));