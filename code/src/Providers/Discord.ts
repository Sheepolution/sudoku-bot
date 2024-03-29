import { Client, GatewayIntentBits, Guild, Interaction, Message, MessageReaction, PartialMessage, PartialMessageReaction, Partials, User } from 'discord.js';
import BotManager from '../Managers/BotManager';
import DiscordService from '../Services/DiscordService';
import { REST } from '@discordjs/rest';

export default class Discord {

    public static client: Client;
    public static rest: REST;

    public static eventReadyCallback: Function;
    public static eventGuildCreateCallback: Function;
    public static eventGuildDeleteCallback: Function;
    public static eventMessageCallback: Function;
    public static eventMessageUpdateCallback: Function;
    public static eventReactionAddCallback: Function;

    public static SetEventReadyCallback(callback: Function) {
        this.eventReadyCallback = callback;
    }

    public static SetEventGuildCreateCallback(callback: Function) {
        this.eventGuildCreateCallback = callback;
    }

    public static SetEventGuildDeleteCallback(callback: Function) {
        this.eventGuildDeleteCallback = callback;
    }

    public static SetEventMessageCallback(callback: Function) {
        this.eventMessageCallback = callback;
    }

    public static SetEventMessageUpdateCallback(callback: Function) {
        this.eventMessageUpdateCallback = callback;
    }

    public static SetEventReactionAddCallback(callback: Function) {
        this.eventReactionAddCallback = callback;
    }

    public static Init() {
        this.client = new Client({
            partials: [Partials.Reaction, Partials.Channel],
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages
            ]
        });

        DiscordService.SetClient(this.client);

        this.client.once('ready', () => { Discord.EventReady(); });
        this.client.on('guildCreate', (guild) => { Discord.EventGuildCreate(guild); });
        this.client.on('guildDelete', (guild) => { Discord.EventGuildDelete(guild); });
        this.client.on('messageCreate', (message) => { Discord.EventMessage(message); });
        this.client.on('messageUpdate', (oldMessage, newMessage) => { Discord.EventMessageUpdate(oldMessage, newMessage); });
        this.client.on('messageReactionAdd', async (reaction, user) => { await Discord.EventReactionAdd(reaction, <User>user); });
        this.client.on('interactionCreate', async (interaction) => { await Discord.EventInteraction(interaction); });
        this.client.login(process.env.TOKEN);

        this.rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    }

    public static GetClient() {
        return this.client;
    }

    private static EventReady() {
        if (this.eventReadyCallback == null) {
            return;
        }

        this.eventReadyCallback();
    }

    private static EventGuildCreate(guild: Guild) {
        if (this.eventGuildCreateCallback == null) {
            return;
        }

        this.eventGuildCreateCallback(guild);
    }

    private static EventGuildDelete(guild: Guild) {
        if (this.eventGuildDeleteCallback == null) {
            return;
        }

        this.eventGuildDeleteCallback(guild);
    }

    private static EventMessage(message: Message) {
        if (this.eventMessageCallback == null) {
            return;
        }

        if (message.author.bot) {
            return;
        }

        this.eventMessageCallback(message);
    }

    private static async EventMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
        if (this.eventMessageUpdateCallback == null) {
            return;
        }

        if (newMessage.partial) {
            try {
                await newMessage.fetch();
            } catch (error) {
                return;
            }
        }

        if (newMessage.author.bot) {
            return;
        }

        this.eventMessageUpdateCallback(newMessage, true);
    }

    private static async EventReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User) {
        if (this.eventReactionAddCallback == null) {
            return;
        }

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        if (user.bot) {
            return;
        }

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        if (user.bot) {
            return;
        }

        this.eventReactionAddCallback(reaction, user);
    }

    private static async EventInteraction(interaction: Interaction) {
        if (interaction.isCommand()) {
            await BotManager.OnInteraction(interaction);
        }
    }
}