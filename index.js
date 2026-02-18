const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // COMANDO LOJA
  if (cmd === "loja") {

    const embed = new EmbedBuilder()
      .setTitle("🛒 TK SCRIPTS STORE")
      .setDescription("Escolha seu produto abaixo 👇")
      .addFields({
        name: "✨ Holograma",
        value: "Preço: R$10\nDigite `!comprar holograma`"
      })
      .setColor("Pink");

    message.channel.send({ embeds: [embed] });
  }

  // COMPRAR
  if (cmd === "comprar") {
    const produto = args[0];

    if (produto !== "holograma") {
      return message.reply("❌ Produto inválido.");
    }

    // ANTI GOLPE (verifica se já está comprando)
    if (config.comprasAtivas.includes(message.author.id)) {
      return message.reply("⚠️ Você já tem uma compra ativa.");
    }

    config.comprasAtivas.push(message.author.id);
    require("fs").writeFileSync("./config.json", JSON.stringify(config, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("💳 Pagamento")
      .setDescription("Envie o comprovante no privado.")
      .setColor("Pink");

    message.author.send({ embeds: [embed] });

    message.reply("📩 Te enviei mensagem no privado.");
  }
});

// LOGS + ENTREGA
client.on("messageCreate", async (message) => {
  if (message.channel.type !== 1) return; // DM
  if (message.author.bot) return;

  if (!config.comprasAtivas.includes(message.author.id)) return;

  const log = client.channels.cache.get(config.logs);

  const embed = new EmbedBuilder()
    .setTitle("🧾 Novo comprovante")
    .setDescription(`Usuário: ${message.author}`)
    .setColor("Pink");

  log.send({ embeds: [embed] });

  // ENTREGA AUTOMÁTICA
  message.channel.send("✅ Pagamento recebido! Aqui está seu produto:");

  message.channel.send(config.estoque.holograma);

  // Remove da lista
  config.comprasAtivas = config.comprasAtivas.filter(id => id !== message.author.id);
  require("fs").writeFileSync("./config.json", JSON.stringify(config, null, 2));
});

client.login(process.env.TOKEN);
