import { Routes, SlashCommandBuilder } from 'discord.js';
import RedisConstants from '../Constants/RedisConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import ICooldownInfo from '../Interfaces/ICooldownInfo';
import IMessageInfo from '../Interfaces/IMessageInfo';
import ISpamInfo from '../Interfaces/ISpamInfo';
import Discord from '../Providers/Discord';
import { Redis } from '../Providers/Redis';

export default class CommandManager {

    private static readonly spamKey = RedisConstants.REDIS_KEY + RedisConstants.USER_KEY + RedisConstants.SPAM_KEY;
    private static readonly cooldownKey = RedisConstants.REDIS_KEY + RedisConstants.USER_KEY + RedisConstants.COOLDOWN_KEY;

    public static async CheckSpam(messageInfo: IMessageInfo): Promise<ISpamInfo> {
        const spamKey = this.spamKey + messageInfo.user.id;
        const total = await Redis.incr(spamKey);
        var spam = false;
        var warn = false;

        Redis.expire(spamKey, SettingsConstants.SPAM_EXPIRE_TIME);

        if (total >= 5) {
            spam = true;
            warn = total == 5;
        }

        return { spam: spam, warn: warn };
    }

    public static async GetCooldown(messageInfo: IMessageInfo): Promise<ICooldownInfo> {
        const cooldownKey = `${this.cooldownKey + messageInfo.user.id}:${messageInfo.commandInfo.command}`;

        var time = 0;
        var cooldown = await Redis.get(cooldownKey);

        if (cooldown == null) {
            return { time: 0, tell: false };
        } else {
            time = await Redis.ttl(cooldownKey);
            cooldown = parseInt(cooldown) + 1;
            Redis.set(cooldownKey, cooldown, 'ex', time);
        }

        return { time: time, tell: cooldown < 5 };
    }

    public static SetCooldown(messageInfo: IMessageInfo, time: number) {
        const cooldownKey = `${this.cooldownKey + messageInfo.user.id}:${messageInfo.commandInfo.command}`;
        Redis.set(cooldownKey, 1, 'ex', time);
    }

    public static UpdateSlashCommands() {
        const data = [
            new SlashCommandBuilder()
                .setName('channel')
                .setDescription('Set in which channel the bot can be used')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to set')
                        .setRequired(true)).toJSON(),
            new SlashCommandBuilder()
                .setName('play')
                .setDescription('Start a new Sudoku')
                .addBooleanOption(option =>
                    option.setName('royale')
                        .setDescription('Whether this Sudoku is a Royale')
                        .setRequired(false)
                )
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('The person you want to play against')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('embed')
                        .setDescription('Whether the message should have an embed')
                        .setRequired(false)
                ).toJSON(),
            new SlashCommandBuilder()
                .setName('stop')
                .setDescription('Stop the current Sudoku'),
            new SlashCommandBuilder()
                .setName('name')
                .setDescription('Set your name')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name to set')
                        .setRequired(true)).toJSON(),
            new SlashCommandBuilder()
                .setName('stats')
                .setDescription('Get your stats').toJSON(),
            new SlashCommandBuilder()
                .setName('leaderboard')
                .setDescription('Get the leaderboard')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of leaderboard')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Solved', value: 'solved' },
                            { name: 'Fastest', value: 'fastest' },
                            { name: 'Streak', value: 'streak' },
                            { name: 'Average', value: 'average' },
                        )
                )
                .addIntegerOption(option =>
                    option.setName('sudoku')
                        .setDescription('The sudoku ID you want the leaderbord for')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('server')
                        .setDescription('Whether to get the leaderboard for this server')
                        .setRequired(false)
                ).toJSON(),
            new SlashCommandBuilder()
                .setName('top')
                .setDescription('Get the leaderboard')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of leaderboard')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Solved', value: 'solved' },
                            { name: 'Fastest', value: 'fastest' },
                            { name: 'Streak', value: 'streak' },
                            { name: 'Average', value: 'average' },
                        )
                )
                .addIntegerOption(option =>
                    option.setName('sudoku')
                        .setDescription('The sudoku ID you want the leaderbord for')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('server')
                        .setDescription('Whether to get the leaderboard for this server')
                        .setRequired(false)
                ).toJSON(),
            new SlashCommandBuilder()
                .setName('help')
                .setDescription('Get information about the bot')
                .toJSON(),
            new SlashCommandBuilder()
                .setName('rules')
                .setDescription('Get the rules about using the bot')
                .toJSON(),
            new SlashCommandBuilder()
                .setName('invite')
                .setDescription('Get the invite link for the bot')
                .toJSON(),
            new SlashCommandBuilder()
                .setName('developer')
                .setDescription('Get information about the developer')
                .toJSON(),
            new SlashCommandBuilder()
                .setName('donate')
                .setDescription('<3')
                .toJSON(),
        ];

        Discord.rest.put(
            Routes.applicationCommands(SettingsConstants.BOT_ID),
            { body: data },
        );
    }
}