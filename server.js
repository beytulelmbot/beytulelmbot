const { Telegraf, Markup } = require('telegraf');
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const http = require('http');

// Firebase Initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const ADMIN_CHAT_ID = "8791540989"; 
const userSessions = {};

// 1. Start Command
bot.start((ctx) => {
  ctx.reply(
    'ሰላም! ወደ በይቱል-ዒልም የቁርኣን እና የተርቢያ ማዕከል እንኳን ደህና መጡ። እባክዎ ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ፡',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📋 ምዝገባ (Registration)', 'https://beytulelmbot.netlify.app/register')],
      [Markup.button.callback('📞 እንግዳ ተቀባይ (Reception)', 'reception'), Markup.button.callback('ℹ️ ስለ እኛ', 'about')],
      [Markup.button.callback('❓ እርዳታ', 'help')]
    ])
  );
});

// 2. WebApp Registration
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

    await ctx.reply(`Dear ${data.fullName}, you have registered successfully. Congratulations on joining Beytul-Elm!`);

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

// 3. Actions
bot.action('reception', (ctx) => {
  userSessions[ctx.from.id] = 'WAITING_FOR_RECEPTION_MSG';
  ctx.reply('📩 እባክዎን ጥያቄዎን ወይም አስተያየትዎን እዚህ ይጻፉልን። የሪሰፕሽን ክፍላችን አይቶ ወዲያውኑ ምላሽ ይሰጥዎታል።');
});

bot.action('about', async (ctx) => {
  await ctx.answerCbQuery();
  const aboutText = `
✨ <b>የበይቱል-ዒልም የቁርኣን እና የተርቢያ ማዕከል</b>

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
  `;

  await ctx.reply(aboutText, { 
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ ወደ ዋናው ሜኑ', 'main_menu')]])
  });
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  const helpText = `
❓ <b>የቦቱ አጠቃቀም መመሪያ</b>

1️⃣ <b>📋 ምዝገባ (Registration)፦</b> 
የምዝገባ ፎርሙን በመሙላት የአዲስ ተማሪነት ምዝገባ ለማጠናቀቅ ይጠቀሙበት።

2️⃣ <b>📞 እንግዳ ተቀባይ (Reception)፦</b> 
ማንኛውም ጥያቄ፣ አስተያየት ወይም ቅሬታ ካልዎት እዚህ ላይ ይፃፉልን። የሪሰፕሽን ክፍላችን በቀጥታ ምላሽ ይሰጥዎታል።

3️⃣ <b>ℹ️ ስለ እኛ (About Us)፦</b> 
ስለ ማዕከላችን አጠቃላይ መረጃ እና የምንሰጣቸውን ትምህርቶች ለማወቅ።
  `;

  await ctx.reply(helpText, { 
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ ወደ ዋናው ሜኑ', 'main_menu')]])
  });
});

bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    'እባክዎ ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ፡',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📋 ምዝገባ (Registration)', 'https://beytulelmbot.netlify.app/register')],
      [Markup.button.callback('📞 እንግዳ ተቀባይ (Reception)', 'reception'), Markup.button.callback('ℹ️ ስለ እኛ', 'about')],
      [Markup.button.callback('❓ እርዳታ', 'help')]
    ])
  );
});

// 4. Text Messages & Admin Reply
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  if (userSessions[userId] === 'WAITING_FOR_RECEPTION_MSG') {
    delete userSessions[userId];
    await ctx.reply('ቀጥታ ለሪሰፕሽን ደርሷል! አጭር ጊዜ ውስጥ ምላሽ እንሰጥዎታለን። አመሰግናለሁ!');

    await bot.telegram.sendMessage(ADMIN_CHAT_ID,
      `📩 <b>አዲስ የሪሰፕሽን መልዕክት!</b>\n\n` +
      `👤 <b>ላኪ:</b> ${ctx.from.first_name} (@${ctx.from.username || 'NoUsername'})\n` +
      `🆔 <b>ID:</b> <code>${userId}</code>\n\n` +
      `💬 <b>መልዕክት:</b>\n${ctx.message.text}`,
      { parse_mode: 'HTML' }
    );
    return;
  }

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

// Bot Start
bot.launch().then(() => console.log('Telegram Bot successfully started!'));

// Render Health Check & Keeping Alive
const PORT = process.env.PORT || 3000;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Beytul Elm Bot is active 24/7!\n');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Render እንዳይተኛ (Sleep እንዳያደርግ) በየ14 ደቂቃው ራሱን Ping የሚያደርግ
  if (RENDER_EXTERNAL_URL) {
    setInterval(() => {
      http.get(RENDER_EXTERNAL_URL, (res) => {
        console.log(`Self-ping response: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('Self-ping error:', err.message);
      });
    }, 14 * 60 * 1000); // Every 14 minutes
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));