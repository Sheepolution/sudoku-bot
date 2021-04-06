import { Message, TextChannel, User } from 'discord.js';
import CommandConstants from '../Constants/CommandConstants';
import EmojiConstants from '../Constants/EmojiConstants';
import RedisConstants from '../Constants/RedisConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import SudokuConstants from '../Constants/SudokuConstants';
import PlayEmbeds from '../Embeds/PlayEmbeds';
import { PlayType } from '../Enums/PlayType';
import IMessageInfo from '../Interfaces/IMessageInfo';
import CommandManager from '../Managers/CommandManager';
import PlayerManager from '../Managers/PlayerManager';
import PlayManager from '../Managers/PlayManager';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import { Redis } from '../Providers/Redis';
import GuildRepository from '../Repositories/GuildRepository';
import PlayerGuildRepository from '../Repositories/PlayerGuildRepository';
import PlayerRepository from '../Repositories/PlayerRepository';
import SudokuRepository from '../Repositories/SudokuRepository';
import ChannelService from '../Services/ChannelService';
import DiscordService from '../Services/DiscordService';
import MessageService from '../Services/MessageService';
import { Utils } from '../Utils/Utils';

export default class PlayHandler {

    private static readonly messageKey = RedisConstants.REDIS_KEY + RedisConstants.SUDOKU_KEY + RedisConstants.MESSAGE_KEY;

    public static OnCommand(messageInfo: IMessageInfo, guild: Guild) {
        const commands = CommandConstants.COMMANDS;
        const commandInfo = messageInfo.commandInfo;

        switch (messageInfo.commandInfo.commands) {
            case commands.PLAY:
                this.OnPlay(messageInfo, guild, commandInfo.args[0], commandInfo.args[1]);
                break;
            default: return false;
        }

        return true;
    }

    public static async OnSolution(messageInfo: IMessageInfo, guild: Guild, solution: string) {
        const player = await this.GetPlayer(messageInfo.user, guild);
        if (player == null) { return; }

        if (messageInfo.edit) {
            const oldMessageId = await Redis.get(this.messageKey + messageInfo.message.id);
            var oldMessage: Message;
            if (oldMessageId != null) {
                oldMessage = (<TextChannel>messageInfo.channel).messages.cache.get(oldMessageId);
            }
        }

        const numbers = solution.replace(/[^\d]/g, '');
        if (numbers.length != SudokuConstants.AMOUNT_OF_TOTAL_NUMBERS) {
            var botMessage: Message;
            if (numbers.length > SudokuConstants.AMOUNT_OF_STARTING_NUMBERS) {
                if (!PlayManager.IsPlayerPlaying(guild, player)) {
                    // TODO: Check if there is a Battle Royale going on
                    botMessage = await MessageService.ReplyMessage(messageInfo, 'The sudoku you\'re trying to solve is not meant for you, or has already been solved.', false, true, null, oldMessage);
                    return;
                }

                const diff = SudokuConstants.AMOUNT_OF_TOTAL_NUMBERS - numbers.length;
                botMessage = await MessageService.ReplyMessage(messageInfo, `You're still missing ${diff} number${diff == 1 ? '' : 's'}.`, false, true, null, oldMessage);
            } else if (numbers.length == SudokuConstants.AMOUNT_OF_STARTING_NUMBERS) {
                if (!PlayManager.IsPlayerPlaying(guild, player)) {
                    return;
                }

                botMessage = await MessageService.ReplyMessage(messageInfo, 'At least try solving it?', false, true, null, oldMessage);
            }

            if (botMessage != null) {
                Redis.set(this.messageKey + messageInfo.message.id, botMessage.id, 'ex', Utils.GetMinutesInSeconds(1));
            }

            return;
        }

        const resultInfo = await PlayManager.SolvePlay(messageInfo, solution, guild, player);
        if (resultInfo.result) {
            await Redis.del(this.messageKey + messageInfo.message.id);
            const solvedMessage = await MessageService.ReplyEmbed(messageInfo, await PlayEmbeds.GetSolvedEmbed(resultInfo.data.play, player, guild), null, oldMessage);

            const message = (<TextChannel>messageInfo.channel).messages.cache.get(resultInfo.data.play.GetMessageId());
            if (message != null) {
                message.edit(PlayEmbeds.GetEditSinglePlayerSudokuEmbed(player, solvedMessage.url));
            }

        } else {
            MessageService.ReplyMessage(messageInfo, resultInfo.reason, null, null, null, oldMessage);
        }
    }

    public static async OnAcceptChallenge(messageInfo: IMessageInfo) {
        const guild = await GuildRepository.GetByDiscordId(messageInfo.guild.id);
        if (guild == null) {
            return;
        }

        const challenge = await PlayManager.GetChallenge(guild, messageInfo.message.id);
        if (challenge == null) {
            return;
        }

        if (messageInfo.user.id != challenge.opponent_id) {
            return;
        }

        const player = await PlayerRepository.GetByDiscordId(challenge.player_id);
        const opponent = await PlayerRepository.GetByDiscordId(challenge.opponent_id);

        DiscordService.RemoveAllReactions(messageInfo, messageInfo.message);

        await Utils.Sleep(SettingsConstants.CHALLENGE_DELAY_TIME);

        const sudoku = await SudokuRepository.GetRandom();
        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSEmbed(sudoku, player, opponent));

        if (message != null) {
            PlayManager.StartVSPlay(sudoku, guild, player, opponent, messageInfo.message.createdAt, message.id);
        }

    }

    private static async OnPlay(messageInfo: IMessageInfo, guild: Guild, type: string, opponentMention: string) {
        if (!await ChannelService.CheckChannel(messageInfo)) {
            return;
        }

        const player = await this.GetPlayer(messageInfo.user, guild);
        if (player == null) {
            MessageService.ReplyMessage(messageInfo, 'You have been banned from using this bot.', false, true);
        }

        if (!type?.isFilled() || type == 'single') {
            this.OnSingleplayerGame(messageInfo, guild, player);
            return;
        } else if (type == 'vs') {
            this.OnVSGame(messageInfo, guild, player, opponentMention);
            return;
            // } else if (type == 'royale') {
            // TODO: Check if a royale is already going on.
            // TODO: Is everyone allowed to start a royale? Yeah sure why not I suppose?
            // But then don't have a stat like "Most royales won" because that doesn't say much I guess?
            // return;
        } else {
            MessageService.ReplyMessage(messageInfo, 'The game types that are available are `single` and `vs`.', false, true);
            return;
        }
    }

    private static async OnSingleplayerGame(messageInfo: IMessageInfo, guild: Guild, player: Player) {
        const play = await PlayManager.GetPlay(guild, player);
        if (play != null && play.GetType() == PlayType.VS) {
            MessageService.ReplyMessage(messageInfo, `You can't start a new game because you're still in a Multiplayer Sudoku with ${(await play.GetOpponent(player)).GetName()}.`, false, true);
            return;
        }

        const sudoku = await SudokuRepository.GetRandom();
        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetSinglePlayerEmbed(sudoku, player));

        if (message != null) {
            PlayManager.StartPlay(sudoku, guild, player, messageInfo.message.createdAt, message.id);
        }

        CommandManager.SetCooldown(messageInfo, 30);

    }

    private static async OnVSGame(messageInfo: IMessageInfo, guild: Guild, player: Player, opponentMention: string) {
        const play = await PlayManager.GetPlay(guild, player);
        if (play != null && play.GetType() == PlayType.VS) {
            MessageService.ReplyMessage(messageInfo, `You can't start a new game because you're still in a Multiplayer Sudoku with ${(await play.GetOpponent(player)).GetName()}.`, false, true);
            return;
        }

        if (!opponentMention?.isFilled()) {
            MessageService.ReplyMessage(messageInfo, 'You need to mention the person you want to challenge.', false, true);
            return;
        }

        const member = await DiscordService.FindMember(opponentMention, messageInfo.guild);
        if (member == null) {
            MessageService.ReplyMessage(messageInfo, 'I\'m not able to find this member.', false, true);
            return;
        }

        const opponent = await this.GetPlayer(member.user, guild);

        if (opponent == null) {
            MessageService.ReplyMessage(messageInfo, 'This member is banned, so they can\'t be challenged.', false, true);
            return;
        }

        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSChallengeEmbed(player, opponent));
        await PlayManager.CreateChallenge(guild, message.id, player.GetDiscordId(), opponent.GetDiscordId());

        if (DiscordService.CheckPermission(messageInfo, 'ADD_REACTIONS')) {
            await message.react(EmojiConstants.STATUS.GOOD).catch();
            await Utils.Sleep(.5);
            await message.react(EmojiConstants.STATUS.BAD).catch();
        }

        await Utils.Sleep(Utils.GetMinutesInSeconds(SettingsConstants.CHALLENGE_EXPIRE_TIME));
        if (await PlayManager.DeleteChallenge(guild, message.id)) {
            DiscordService.RemoveAllReactions(messageInfo, message);
            MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSChallengeNotAcceptedEmbed(player, opponent), null, message);
        }
    }

    private static async GetPlayer(user: User, guild: Guild) {
        const player = await PlayerManager.GetPlayer(user.id, user.username, guild);
        if (player == null) {
            return;
        }

        const playerGuild = await PlayerGuildRepository.GetByPlayerIdAndGuildId(player, guild);
        if (playerGuild == null) {
            PlayerGuildRepository.New(player, guild);
        }

        return player;
    }
}