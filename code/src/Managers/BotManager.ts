import CommandHandler from '../Handlers/CommandHandler';
import IMessageInfo from '../Interfaces/IMessageInfo';
import { Guild as DiscordGuild, Message, MessageReaction, User } from 'discord.js';
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
        Discord.GetClient().user?.setActivity(`${SettingsConstants.DEFAULT_PREFIX}help`, { type: 'WATCHING' });
    }

    public static async OnMessage(message: Message, edit?: boolean) {
        if (message.channel.type == 'dm') {
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

        if (!messageInfo.message.content.startsWith(prefix)) {
            MessageHandler.OnMessage(messageInfo);
            return;
        }

        CommandHandler.OnCommand(messageInfo, content, guild);
    }

    public static async OnReaction(reaction: MessageReaction, user: User) {
        if (reaction.message.channel.type == 'dm') {
            return;
        }

        const messageInfo: IMessageInfo = DiscordUtils.ParseMessageToInfo(reaction.message, user);

        if (!await ChannelService.CheckChannel(messageInfo)) {
            return;
        }

        ReactionManager.OnReaction(messageInfo, reaction);
    }

    public static async ClearPrefixCache(messageInfo: IMessageInfo) {
        var prefixKey = this.prefixKey + messageInfo.message.guild.id;
        await Redis.del(prefixKey);
    }

    public static async OnAddedToGuild(discordGuild: DiscordGuild) {
        const guild = await GuildRepository.GetOrCreateByDiscordId(discordGuild.id);
        await guild.OnJoin();
    }

    public static async OnKickedFromGuild(discordGuild: DiscordGuild) {
        const guild = await GuildRepository.GetOrCreateByDiscordId(discordGuild.id);
        await guild.OnLeave();
        LogService.Log(LogType.GuildRemoved, guild);
    }
}
