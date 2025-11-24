// main.js — Kayzee KeyBot 24/7
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const CONFIG = {
  TOKEN: process.env.BOT_TOKEN,
  OWNER_ID: process.env.OWNER_ID,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  REPO: "Skyzee02/skntlxxnxxnxxnxxnxx01",
  BRANCH: "main",
  FILE_PATH: "key.json"
};

const DURATIONS = ["1Day", "7Days", "30Days", "Lifetime"];

client.once('ready', () => {
  console.log(`Bot Online → ${client.user.tag}`);
  client.user.setActivity('!addkey | Kayzee Key Manager');
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot || !msg.content.startsWith('!addkey') || msg.author.id !== CONFIG.OWNER_ID) return;

  const args = msg.content.slice(8).trim().split('|');
  if (args.length < 2) return msg.reply("Contoh: `!addkey KAYZEE-999 | 30Days | Sekayzee69`");

  const key = args[0].trim().toUpperCase();
  const duration = args[1].trim();
  const whitelist = args[2] ? args[2].trim().split(/\s+/).filter(Boolean) : [];

  if (!DURATIONS.includes(duration)) return msg.reply("Durasi salah! Pilih: 1Day, 7Days, 30Days, Lifetime");

  try {
    const raw = await fetch(`https://raw.githubusercontent.com/${CONFIG.REPO}/${CONFIG.BRANCH}/${CONFIG.FILE_PATH}`);
    let data = raw.ok ? await raw.json() : [];
    if (!Array.isArray(data)) data = [];

    if (data.some(k => k.key === key)) return msg.reply("Key sudah ada!");

    data.push({
      key,
      duration,
      created_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
      whitelist: whitelist.length > 0 ? whitelist : []
    });

    const base64 = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const sha = await (await fetch(`https://api.github.com/repos/${CONFIG.REPO}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.BRANCH}`, {
      headers: { Authorization: `token ${CONFIG.GITHUB_TOKEN}` }
    })).json().then(d => d.sha).catch(() => undefined);

    const res = await fetch(`https://api.github.com/repos/${CONFIG.REPO}/contents/${CONFIG.FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add key: ${key} (${duration})`,
        content: base64,
        sha,
        branch: CONFIG.BRANCH
      })
    });

    if (res.ok) {
      msg.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("Key Berhasil Ditambahkan!")
          .addFields(
            { name: "Key", value: `\`${key}\``, inline: true },
            { name: "Durasi", value: duration, inline: true },
            { name: "Whitelist", value: whitelist.length ? whitelist.join(", ") : "Semua user" }
          )
        ]
      });
    } else throw new Error(await res.text());
  } catch (e) {
    console.error(e);
    msg.reply("Error: " + e.message);
  }
});

client.login(CONFIG.TOKEN);
