const { Telegraf, Markup } = require('telegraf');
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// የእርስዎ የግል Telegram ID (መረጃዎችና ጥያቄዎች የሚመጡበት)
const ADMIN_CHAT_ID = "8791540989"; 

// የተጠቃሚዎችን የሪሰፕሽን ሁኔታ (State) ለመያዝ
const userSessions = {};

// Start Command
bot.start((ctx) => {
  ctx.reply(
    'ሰላም! ወደ ቤይቱል-ዒልም የቁርኣን እና የተርቢያ ማዕከል እንኳን ደህና መጡ። እባክዎ ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ፡',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📋 ሬጅስትሬሽን (Registration)', 'https://beytulelmbot.netlify.app/register')],
      [Markup.button.callback('📞 ሪሰፕሽን (Reception)', 'reception'), Markup.button.callback('ℹ️ ስለ እኛ', 'about')],
      [Markup.button.callback('❓ እርዳታ', 'help')]
    ])
  );
});

// WebApp Registration Data handling
bot.on('web-app-data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);

    await db.collection('students').add({
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      course: data.course,
      telegramId: ctx.from.id,
      registeredAt: new Date()
    });

    // ለተማሪው የሚላክ የማረጋገጫ መልዕክት
    await ctx.reply(`Dear ${data.fullName}, you have registered successfully. Congratulations on joining Beytul-Elm!`);

    // ለAdmin/Reception የሚላክ ማስታወቂያ
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, 
      `🆕 <b>አዲስ የተማሪ ምዝገባ!</b>\n\n` +
      `👤 <b>ስም:</b> ${data.fullName}\n` +
      `📞 <b>ስልክ:</b> ${data.phone}\n` +
      `📍 <b>አድራሻ:</b> ${data.address}\n` +
      `📚 <b>ትምህርት:</b> ${data.course}\n` +
      `🆔 <b>Telegram ID:</b> ${ctx.from.id}`,
      { parse_mode: 'HTML' }
    );

  } catch (error) {
    console.error('Firestore Error: ', error);
    await ctx.reply('Sorry, could not register at the moment. Please try again!');
  }
});

// የሪሰፕሽን (Reception) ቁልፍ ሲጫን
bot.action('reception', (ctx) => {
  userSessions[ctx.from.id] = 'WAITING_FOR_RECEPTION_MSG';
  ctx.reply('📩 እባክዎን ጥያቄዎን ወይም አስተያየትዎን እዚህ ይጻፉልን። የሪሰፕሽን ክፍላችን አይቶ ወዲያውኑ ምላሽ ይሰጥዎታል።');
});

// ℹ️ ስለ እኛ (About Us)
bot.action('about', async (ctx) => {
  await ctx.answerCbQuery();
  
  const aboutText = `
✨ <b>የቤይቱል-ዒልም የቁርኣን እና የተርቢያ ማዕከል</b>

👁‍🗨 <b>ራዕይ (Vision)፦</b>
በ2028 በዓለም ዙሪያ ለሚገኙ ኢትዮጵያውያን ሙስሊሞች አለኝታ በመሆን፤ የቁርኣን እና የተርቢያ ትምህርቶችን ኦንላይን የሚያደርስ መሪ ማዕከል መሆን!

🎯 <b>ተልዕኮ (Mission)፦</b>
ሙስሊሞችን በቁርኣን፣ በሱና እና በተርቢያ በማስተማር፤ በእማን፣ እውቀትና እኽላቅ የተሞላ ትውልድ በመፍጠር የአላህን ቃል በሕይወታቸው እንዲተገብሩ መርዳት።

⭐ <b>እሴቶች (Core Values)፦</b>
• <b>ኢማን (Iman)</b>
• <b>እውቀት (Ilm)</b>
• <b>እኽላቅ (Akhlaq)</b>
• <b>ታማኝነት (Amanah)</b>
• <b>ትብብር (Ta'awun)</b>

📖 <b>ተግባራት (Programs & Services)፦</b>
• የቁርኣን ትምህርት (Hifz & Tajweed)
• የተርቢያና የእኽላቅ ሥልጠና
• የተለያዩ የኪታብ ዓይነቶች ትምህርት
• የኦንላይን የቤተሰብ ትምህርት
• የተፍሲር እና የኸጥ ትምህርት

🌐 <i>የቁርኣንና የተርቢያ ትምህርት ለሁሉም ሙስሊሞች በኦንላይን!</i>
  `;

  await ctx.reply(aboutText, { 
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ ወደ ዋናው ሜኑ', 'main_menu')]
    ])
  });
});
// ❓ እርዳታ (Help)
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  
  const helpText = `
❓ <b>የቦቱ አጠቃቀም መመሪያ</b>

1️⃣ <b>📋 ሬጅስትሬሽን (Registration)፦</b> 
የምዝገባ ፎርሙን በመሙላት የአዲስ ተማሪነት ምዝገባ ለማጠናቀቅ ይጠቀሙበት።

2️⃣ <b>📞 ሪሰፕሽን (Reception)፦</b> 
ማንኛውም ጥያቄ፣ አስተያየት ወይም ቅሬታ ካልዎት እዚህ ላይ ይፃፉልን። የሪሰፕሽን ክፍላችን በቀጥታ ምላሽ ይሰጥዎታል።

3️⃣ <b>ℹ️ ስለ እኛ (About Us)፦</b> 
ስለ ማዕከላችን አጠቃላይ መረጃ እና የምንሰጣቸውን ትምህርቶች ለማወቅ።

⚠️ <i>ችግር ካጋጠመዎት በሪሰፕሽን በኩል መልዕክት መላክ ይችላሉ!</i>
  `;

  await ctx.reply(helpText, { 
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ ወደ ዋናው ሜኑ', 'main_menu')]
    ])
  });
});
// 🔄 ወደ ዋናው ሜኑ ለመመለስ (Back to Main Menu)
bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    'እባክዎ ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ፡',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📋 ሬጅስትሬሽን (Registration)', 'https://beytulelmbot.netlify.app/register')],
      [Markup.button.callback('📞 ሪሰፕሽን (Reception)', 'reception'), Markup.button.callback('ℹ️ ስለ እኛ', 'about')],
      [Markup.button.callback('❓ እርዳታ', 'help')]
    ])
  );
});
// ማንኛውንም የጽሁፍ መልዕክት የማስተናገጃ ኮድ
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  // 1. ተጠቃሚው ለሪሰፕሽን የጻፈው መልዕክት ከሆነ
  if (userSessions[userId] === 'WAITING_FOR_RECEPTION_MSG') {
    delete userSessions[userId]; // ሴሽኑን ማፅዳት

    // ለተጠቃሚው ምላሽ መስጠት
    await ctx.reply('ቀጥታ ለሪሰፕሽን ደርሷል! አጭር ጊዜ ውስጥ ምላሽ እንሰጥዎታለን። አመሰግናለሁ!');

    // መልዕክቱን ቀጥታ ወደ Admin/Reception መላክ
    await bot.telegram.sendMessage(ADMIN_CHAT_ID,
      `📩 <b>አዲስ የሪሰፕሽን መልዕክት!</b>\n\n` +
      `👤 <b>ላኪ:</b> ${ctx.from.first_name} (@${ctx.from.username || 'NoUsername'})\n` +
      `🆔 <b>ID:</b> <code>${userId}</code>\n\n` +
      `💬 <b>መልዕክት:</b>\n${ctx.message.text}`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // 2. Admin ከተጠቃሚዎች ለቀረቡ ጥያቄዎች Reply ሲያደርግ (Admin reply to user)
  if (userId.toString() === ADMIN_CHAT_ID && ctx.message.reply_to_message) {
    const replyText = ctx.message.reply_to_message.text;
    const match = replyText && replyText.match(/ID:\s*(\d+)/);

    if (match) {
      const targetUserId = match[1];
      try {
        await bot.telegram.sendMessage(targetUserId, `📩 <b>ከሪሰፕሽን የተላከ ምላሽ:</b>\n\n${ctx.message.text}`, { parse_mode: 'HTML' });
        await ctx.reply('✅ ምላሽዎ ለተጠቃሚው ተልኳል።');
      } catch (err) {
        await ctx.reply('❌ መልዕክቱን መላክ አልተቻለም። ተጠቃሚው ቦቱን አግዶት ሊሆን ይችላል።');
      }
    }
  }
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