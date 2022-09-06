import CommandHandler from '../Handlers/CommandHandler';
import IMessageInfo from '../Interfaces/IMessageInfo';
import { ActivityType, Guild as DiscordGuild, Interaction, Message, MessageReaction, User } from 'discord.js';
import DiscordUtils from '../Utils/DiscordUtils';
import Guild from '../Objects/Guild';
import GuildRepository from '../Repositories/GuildRepository';
import RedisConstants from '../Constants/RedisConstants';
import { Redis } from '../Providers/Redis';
import { Utils } from '../Utils/Utils';
import CacheManager from './CacheManager';
import SettingsConstants from '../Constants/SettingsConstants';
import MessageHandler from '../Handlers/MessageHandler';
import ReactionManager from './ReactionManager';
import ChannelService from '../Services/ChannelService';
import Discord from '../Providers/Discord';
import LogService from '../Services/LogService';
import { LogType } from '../Enums/LogType';
import CommandManager from './CommandManager';

export default class BotManager {

    private static readonly prefixKey = RedisConstants.REDIS_KEY + RedisConstants.GUILD_KEY + RedisConstants.PREFIX_KEY;

    public static OnReady() {
        console.log(`${SettingsConstants.BOT_NAME}: Connected`);
        BotManager.CreateActivityInterval();
        CacheManager.CreateTimeoutInterval();
    }

    public static CreateActivityInterval() {
        this.SetActivity();
        setInterval(() => {
            this.SetActivity();
        }, Utils.GetHoursInMiliSeconds(4));
    }

    public static SetActivity() {
        Discord.GetClient().user?.setActivity(`${SettingsConstants.DEFAULT_PREFIX}help`, { type: ActivityType.Watching });
    }

    public static async OnMessage(message: Message, edit?: boolean) {
        if (message.channel.type == 1) {
            if (message.author.id == SettingsConstants.MASTER_ID) {
                if (message.content == ';update-slash-commands') {
                    CommandManager.UpdateSlashCommands();
                    message.reply('Done');
                }
            }
            return;
        }

        const messageInfo: IMessageInfo = DiscordUtils.ParseMessageToInfo(message, message.author);

        if (edit) {
            messageInfo.edit = true;
        }

        var content = message.content.trim();

        var guild: Guild | null;

        var prefixKey = BotManager.prefixKey + message.guild.id;
        var prefix = await Redis.get(prefixKey);
        if (prefix != null && !message.content.startsWith(prefix)) {
            MessageHandler.OnMessage(messageInfo);
            return;
        }

        const discordGuild = messageInfo.guild;
        if (discordGuild == null) {
            return;
        }

        guild = await GuildRepository.GetOrCreateByDiscordId(discordGuild.id);

        prefix = guild.GetPrefix();

        Redis.set(prefixKey, prefix, 'ex', Utils.GetHoursInSeconds(1));

        if (!(messageInfo.message as Message).content.startsWith(prefix)) {
            MessageHandler.OnMessage(messageInfo);
            return;
        }

        CommandHandler.OnCommand(messageInfo, content, guild);
    }

    public static async OnReaction(reaction: MessageReaction, user: User) {
        const messageInfo: IMessageInfo = DiscordUtils.ParseMessageToInfo(reaction.message as Message, user);

        if (reaction.message.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        if (!await ChannelService.CheckChannel(messageInfo)) {
            return;
        }

        ReactionManager.OnReaction(messageInfo, reaction);
    }

    public static async ClearPrefixCache(guildDiscordId: string) {
        var prefixKey = this.prefixKey + guildDiscordId;
        await Redis.del(prefixKey);
    }

    public static async OnAddedToGuild(discordGuild: DiscordGuild) {
        const guild = await GuildRepository.GetOrCreateByDiscordId(discordGuild.id);
        await guild.OnJoin();
        LogService.Log(LogType.GuildJoined, guild);
    }

    public static async OnKickedFromGuild(discordGuild: DiscordGuild) {
        if (discordGuild.name == undefined) {
            return;
        }

        const guild = await GuildRepository.GetOrCreateByDiscordId(discordGuild.id);
        await guild.OnLeave();
        LogService.Log(LogType.GuildLeft, guild);
    }

    public static async OnInteraction(interaction: Interaction) {
        const messageInfo: IMessageInfo = await DiscordUtils.ParseInteractionToInfo(interaction);

        let guild: Guild | null;

        const discordGuild = messageInfo.guild;
        if (discordGuild != null) {
            guild = await GuildRepository.GetOrCreateByDiscordId(discordGuild.id);
        }

        CommandHandler.OnCommand(messageInfo, '', guild);
    }
}
