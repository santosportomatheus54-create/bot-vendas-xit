const { 
Client, GatewayIntentBits, 
EmbedBuilder, ActionRowBuilder, 
ButtonBuilder, ButtonStyle, 
StringSelectMenuBuilder, 
PermissionsBitField 
} = require("discord.js");

const config = require("./config.json");
const estoque = require("./estoque.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log("Bot online!");
});

client.on("interactionCreate", async (interaction) => {

  // BOTÃO LOJA
  if (interaction.isButton() && interaction.customId === "loja") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("produto")
      .setPlaceholder("Selecione o produto")
      .addOptions([
        {
          label: "HOLOGRAMA FF",
          description: "Preço: R$ 2,50",
          value: "HOLOGRAMA FF"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "Escolha o produto:",
      components: [row],
      ephemeral: true
    });
  }

  // ESCOLHER PRODUTO
  if (interaction.isStringSelectMenu() && interaction.customId === "produto") {

    const canal = await interaction.guild.channels.create({
      name: `compra-${interaction.user.username}`,
      parent: config.categoriaTickets,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🛒 Compra - HOLOGRAMA FF")
      .setDescription(
        `Preço: R$ 2,50\n\n` +
        `Envie o Pix para:\n**${config.pix}**\n\n` +
        `Depois clique em confirmar pagamento.`
      )
      .setColor("Green");

    const confirmar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmar")
        .setLabel("Confirmar Pagamento")
        .setStyle(ButtonStyle.Success)
    );

    await canal.send({
      content: interaction.user.toString(),
      embeds: [embed],
      components: [confirmar]
    });

    await interaction.reply({
      content: `Seu canal foi criado: ${canal}`,
      ephemeral: true
    });
  }

  // CONFIRMAR PAGAMENTO
  if (interaction.isButton() && interaction.customId === "confirmar") {
    await interaction.reply({
      content: "Envie o comprovante aqui no chat.",
      ephemeral: true
    });
  }

});


// ENTREGA AUTOMÁTICA (estoque infinito)
client.on("messageCreate", async (msg) => {

  if (!msg.channel.name.startsWith("compra-")) return;
  if (msg.author.bot) return;

  const produto = "HOLOGRAMA FF";
  const link = estoque[produto];

  await msg.reply(`✅ Pagamento aprovado!\n\nAqui está seu produto:\n${link}`);
});


// COMANDO PARA CRIAR PAINEL
client.on("messageCreate", async (msg) => {

  if (msg.content === "!painel") {

    const embed = new EmbedBuilder()
      .setTitle("🛒 Loja TK")
      .setDescription("Clique abaixo para comprar o HOLOGRAMA FF")
      .setColor("Blue");

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("loja")
        .setLabel("🛒 Loja")
        .setStyle(ButtonStyle.Primary)
    );

    msg.channel.send({
      embeds: [embed],
      components: [botao]
    });
  }

});

client.login(config.token);
