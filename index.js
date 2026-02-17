const { 
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

const config = require("./config.json");
const estoque = require("./estoque.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});


// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // coloque no Railway
const GUILD_ID = process.env.GUILD_ID;   // coloque no Railway


// ===== SLASH COMMAND =====
const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Criar painel da loja")
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
})();


// ===== BOT ONLINE =====
client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});


// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {

  // COMANDO /painel
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "painel") {

      const botao = new ButtonBuilder()
        .setCustomId("loja")
        .setLabel("🛒 Loja")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(botao);

      await interaction.reply({
        content: "Clique para abrir a loja",
        components: [row]
      });
    }
  }

  // BOTÃO LOJA
  if (interaction.isButton() && interaction.customId === "loja") {

    const canal = await interaction.guild.channels.create({
      name: `compra-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.categoriaTickets,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ["ViewChannel"]
        },
        {
          id: interaction.user.id,
          allow: ["ViewChannel", "SendMessages"]
        }
      ]
    });

    const holograma = new ButtonBuilder()
      .setCustomId("holograma")
      .setLabel("HOLOGRAMA FF - R$2,50")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(holograma);

    canal.send({
      content: `Olá ${interaction.user}, escolha o produto abaixo:`,
      components: [row]
    });

    interaction.reply({ content: "Canal criado!", ephemeral: true });
  }

  // PRODUTO
  if (interaction.isButton() && interaction.customId === "holograma") {

    const confirmar = new ButtonBuilder()
      .setCustomId("confirmar")
      .setLabel("Confirmar pagamento")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(confirmar);

    await interaction.reply({
      content: `Envie o Pix para: **${config.pix}**`,
      components: [row]
    });
  }

  // ENTREGA
  if (interaction.isButton() && interaction.customId === "confirmar") {

    const link = estoque["HOLOGRAMA FF"];

    await interaction.reply({
      content: `✅ Pagamento aprovado!\n${link}`
    });
  }

});

client.login(TOKEN);
