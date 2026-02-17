const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const config = require("./config.json");
const estoque = require("./estoque.json");

// ===== VARIÁVEIS =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===== BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== SLASH =====
const commands = [
  new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Abrir a loja")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registrando slash...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash registrado!");
  } catch (err) {
    console.error(err);
  }
});

// ===== ONLINE =====
client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {

  // ===== /LOJA =====
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "loja") {

      const botao = new ButtonBuilder()
        .setCustomId("abrir_loja")
        .setLabel("🛒 Abrir Loja")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(botao);

      await interaction.reply({
        content: "Clique abaixo para comprar:",
        components: [row]
      });
    }
  }

  // ===== ABRIR LOJA =====
  if (interaction.isButton() && interaction.customId === "abrir_loja") {

    const canal = await interaction.guild.channels.create({
      name: `compra-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.categoriaTickets,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });

    const holograma = new ButtonBuilder()
      .setCustomId("holograma")
      .setLabel("HOLOGRAMA FF - R$2,50")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(holograma);

    canal.send({
      content: `Olá ${interaction.user}, escolha o produto:`,
      components: [row]
    });

    interaction.reply({ content: "Canal criado!", ephemeral: true });
  }

  // ===== PRODUTO =====
  if (interaction.isButton() && interaction.customId === "holograma") {

    const confirmar = new ButtonBuilder()
      .setCustomId("confirmar")
      .setLabel("Confirmar pagamento")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(confirmar);

    await interaction.reply({
      content: `💰 Envie o Pix para:\n**${config.pix}**\nDepois envie o comprovante.`,
      components: [row]
    });
  }

  // ===== STAFF =====
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("aprovar")) {

      if (!interaction.member.roles.cache.has(config.cargoStaff))
        return interaction.reply({ content: "Sem permissão.", ephemeral: true });

      const canalID = interaction.customId.split("_")[1];
      const canal = interaction.guild.channels.cache.get(canalID);

      const link = estoque["HOLOGRAMA FF"];

      canal.send(`✅ Pagamento aprovado!\n${link}`);

      interaction.reply({ content: "Venda aprovada!", ephemeral: true });
    }

    if (interaction.customId.startsWith("reprovar")) {

      if (!interaction.member.roles.cache.has(config.cargoStaff))
        return interaction.reply({ content: "Sem permissão.", ephemeral: true });

      const canalID = interaction.customId.split("_")[1];
      const canal = interaction.guild.channels.cache.get(canalID);

      canal.send("❌ Comprovante inválido. Envie novamente.");

      interaction.reply({ content: "Reprovado.", ephemeral: true });
    }
  }
});


// ===== COMPROVANTE =====
client.on("messageCreate", async (msg) => {

  if (!msg.channel.name.startsWith("compra-")) return;
  if (msg.author.bot) return;

  // Anti golpe: só imagem
  if (msg.attachments.size === 0) {
    return msg.reply("⚠️ Envie o comprovante em imagem.");
  }

  const canalLogs = msg.guild.channels.cache.get(config.canalLogs);

  const embed = {
    title: "💰 Nova venda",
    description: `Cliente: ${msg.author}\nCanal: ${msg.channel}`,
    color: 0x00ff00
  };

  const aprovar = new ButtonBuilder()
    .setCustomId(`aprovar_${msg.channel.id}`)
    .setLabel("Aprovar")
    .setStyle(ButtonStyle.Success);

  const reprovar = new ButtonBuilder()
    .setCustomId(`reprovar_${msg.channel.id}`)
    .setLabel("Reprovar")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(aprovar, reprovar);

  canalLogs.send({
    embeds: [embed],
    files: [msg.attachments.first().url],
    components: [row]
  });

  msg.reply("📷 Comprovante enviado para análise.");
});

client.login(TOKEN);
