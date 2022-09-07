import { ChatInputCommandInteraction, Message, PermissionFlagsBits, TextChannel, User } from 'discord.js';
import CommandConstants from '../Constants/CommandConstants';
import EmojiConstants from '../Constants/EmojiConstants';
import RedisConstants from '../Constants/RedisConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import SudokuConstants from '../Constants/SudokuConstants';
import PlayEmbeds from '../Embeds/PlayEmbeds';
import PlayerEmbeds from '../Embeds/PlayerEmbeds';
import { LogType } from '../Enums/LogType';
import { PlayType } from '../Enums/PlayType';
import IMessageInfo from '../Interfaces/IMessageInfo';
import CommandManager from '../Managers/CommandManager';
import PlayerManager from '../Managers/PlayerManager';
import PlayManager from '../Managers/PlayManager';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import { Redis } from '../Providers/Redis';
import GuildRepository from '../Repositories/GuildRepository';
import PlayerRepository from '../Repositories/PlayerRepository';
import SudokuRepository from '../Repositories/SudokuRepository';
import ChannelService from '../Services/ChannelService';
import CommandService from '../Services/CommandService';
import DiscordService from '../Services/DiscordService';
import LogService from '../Services/LogService';
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
            case commands.STOP:
                this.OnStop(messageInfo, guild);
                break;
            default: return false;
        }

        return true;
    }

    public static async OnSolution(messageInfo: IMessageInfo, guild: Guild, solution: string) {
        // Remove tag
        solution = solution.replace(/<@!?(\d+)>/g, '');

        const player = await this.GetPlayer(messageInfo.user, guild);
        if (player == null) { return; }

        if (messageInfo.edit) {
            const oldMessageId = await Redis.get(this.messageKey + messageInfo.message.id);
            var oldMessage: Message;
            if (oldMessageId != null) {
                oldMessage = (<TextChannel>messageInfo.channel).messages.cache.get(oldMessageId);
            }
        }

        var play: Play | true;
        play = await PlayManager.GetPlay(player);

        if (play == null) {
            play = await PlayManager.GetRoyalePlay(guild, messageInfo.channel.id);
        }

        if (play == true) {
            return;
        }

        if (play != null) {
            if (play.GetChannelId() != messageInfo.channel.id) {
                return;
            }
        }

        const numbers = solution.replace(/[^\d]/g, '');
        if (numbers.length != SudokuConstants.AMOUNT_OF_TOTAL_NUMBERS) {
            var botMessage: Message;
            if (numbers.length > SudokuConstants.AMOUNT_OF_STARTING_NUMBERS) {
                if (play == null) {
                    await MessageService.ReplyMessage(messageInfo, 'The Sudoku you\'re trying to solve is not meant for you, or has already been solved.', false, true, null, oldMessage);
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
                Redis.set(this.messageKey + messageInfo.message.id, botMessage.id, 'ex', Utils.GetMinutesInSeconds(5));
            }

            return;
        }

        if (play == null) {
            await MessageService.ReplyMessage(messageInfo, 'The Sudoku you\'re trying to solve is not meant for you, or has already been solved.', false, true, null, oldMessage);
            return;
        }

        const resultInfo = await PlayManager.SolvePlay(messageInfo, play, solution, guild, player, messageInfo.channel.id);
        if (resultInfo.result) {
            await Redis.del(this.messageKey + messageInfo.message.id);
            const solvedMessage = await MessageService.ReplyEmbed(messageInfo, await PlayEmbeds.GetSolvedEmbed(resultInfo.data.play, player, guild), null, oldMessage);

            const message = (<TextChannel>messageInfo.channel).messages.cache.get(resultInfo.data.play.GetMessageId());
            if (message != null) {
                try {
                    message.edit({ embeds: [await PlayEmbeds.GetEditSolvedSinglePlayerSudokuEmbed(play, solvedMessage.url)] });
                } catch (error) {
                    // Whatever
                }
            }
        } else {
            if (resultInfo.reason == 'cheated') {
                MessageService.ReplyMessage(messageInfo, '', null, true, player.IsBanned() ? PlayerEmbeds.GetBannedEmbed() : PlayerEmbeds.GetStrikeEmbed(), oldMessage);
            } else {
                MessageService.ReplyMessage(messageInfo, resultInfo.reason, null, null, null, oldMessage);
            }
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

        const play = await PlayManager.GetPlay(player);
        if (play != null) {
            if (play.GetType() == PlayType.Single) {
                PlayManager.HandleUnfinishedPlay(play);
            } else {
                MessageService.ReplyEmbed(messageInfo, await PlayEmbeds.GetReminderEmbed(player, play));
                return;
            }
        }

        const opponent = await PlayerRepository.GetByDiscordId(challenge.opponent_id);
        if (await PlayManager.FindExistingChallenge(guild, opponent)) {
            MessageService.ReplyMessage(messageInfo, 'You need to cancel your own challenge request first.', false, true);
            return;
        }

        if (opponent.IsPreparingPlay()) {
            MessageService.ReplyMessage(messageInfo, 'You can\'t accept this challenge as you\'re about to begin a Sudoku!', false, true);
            return;
        }

        player.SetPreparingPlay(true);
        opponent.SetPreparingPlay(true);

        DiscordService.RemoveAllReactions(messageInfo, messageInfo.message as Message);
        await PlayManager.DeleteChallenge(guild, messageInfo.message.id);

        await Utils.Sleep(SettingsConstants.CHALLENGE_DELAY_TIME);

        const sudoku = await SudokuRepository.GetRandom();
        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSEmbed(sudoku, player, opponent));

        if (message != null) {
            PlayManager.StartVSPlay(sudoku, guild, player, opponent, messageInfo.message.createdAt, message.id, message.channel.id);
        }

        player.SetPreparingPlay(false);
        opponent.SetPreparingPlay(false);
    }

    public static async OnDeclineChallenge(messageInfo: IMessageInfo) {
        const guild = await GuildRepository.GetByDiscordId(messageInfo.guild.id);
        if (guild == null) {
            return;
        }

        const challenge = await PlayManager.GetChallenge(guild, messageInfo.message.id);
        if (challenge == null) {
            return;
        }

        if (messageInfo.user.id == challenge.player_id && messageInfo.user.id == challenge.opponent_id) {
            return;
        }

        const player = await PlayerRepository.GetByDiscordId(challenge.player_id);
        const opponent = await PlayerRepository.GetByDiscordId(challenge.opponent_id);

        if (messageInfo.user.id == challenge.player_id) {
            if (await PlayManager.DeleteChallenge(guild, messageInfo.message.id)) {
                DiscordService.RemoveAllReactions(messageInfo, messageInfo.message as Message);
                MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSChallengeCancelledEmbed(player, opponent), null, messageInfo.message as Message);
            }
        } else if (messageInfo.user.id == challenge.opponent_id) {
            if (await PlayManager.DeleteChallenge(guild, messageInfo.message.id)) {
                DiscordService.RemoveAllReactions(messageInfo, messageInfo.message as Message);
                MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSChallengeNotAcceptedEmbed(player, opponent), null, messageInfo.message as Message);
            }
        }
    }

    private static async OnPlay(messageInfo: IMessageInfo, guild: Guild, type: string, opponentMention: string) {
        if (!await ChannelService.CheckChannel(messageInfo)) {
            return;
        }

        const player = await this.GetPlayer(messageInfo.user, guild);
        if (player == null) {
            MessageService.ReplyMessage(messageInfo, 'You have been banned from using this bot.', false, true);
            CommandManager.SetCooldown(messageInfo, 600);
        }

        if (messageInfo.interaction != null && messageInfo.interaction.isCommand()) {
            const royale = (messageInfo.interaction as ChatInputCommandInteraction).options.getBoolean('royale');
            opponentMention = messageInfo.interaction.options.getUser('opponent', false)?.toString();
            if (opponentMention != null) {
                type = 'vs';
            } else if (royale) {
                type = 'royale';
            }
        }

        // if (!opponentMention?.isFilled() && type?.isFilled()) {
        //     if (DiscordUtils.GetMemberId(type) != null) {
        //         opponentMention = type;
        //         type = 'vs';
        //     }
        // }

        const play = await PlayManager.GetPlay(player);
        if (play != null) {
            if (play.GetType() == PlayType.Single) {
                PlayManager.HandleUnfinishedPlay(play);
            } else {
                MessageService.ReplyEmbed(messageInfo, await PlayEmbeds.GetReminderEmbed(player, play));
                return;
            }
        }

        if (player.IsPreparingPlay()) {
            MessageService.ReplyMessage(messageInfo, 'You\'re already about to start a Sudoku!', false, true);
            CommandManager.SetCooldown(messageInfo, 10);
            return;
        }

        if (type == 'vs') {
            this.OnVSGame(messageInfo, guild, player, opponentMention);
        } else if (!type?.isFilled() || type == 'single') {
            this.OnSingleplayerGame(messageInfo, guild, player);
            return;
        } else if (type == 'royale') {
            this.OnRoyaleGame(messageInfo, guild, player);
        } else {
            MessageService.ReplyMessage(messageInfo, 'The game types that are available are `single`, `vs` and `royale`.', false, true);
            return;
        }
    }

    private static async OnStop(messageInfo: IMessageInfo, guild: Guild) {
        if (!await ChannelService.CheckChannel(messageInfo)) {
            return;
        }

        const player = await this.GetPlayer(messageInfo.user, guild);
        if (player == null) {
            return;
        }

        const play = await PlayManager.GetPlay(player);
        if (play == null) {
            MessageService.ReplyMessage(messageInfo, 'There was no Sudoku to cancel.', false, true);
            CommandManager.SetCooldown(messageInfo, 10);
            return;
        }

        if (play.GetType() == PlayType.VS) {
            MessageService.ReplyMessage(messageInfo, `You can't stop a Multiplayer Sudoku. You or ${(await play.GetOpponent(player)).GetName()} will have to solve it.`, false, true);
            CommandManager.SetCooldown(messageInfo, 10);
            return;
        }

        await PlayManager.HandleUnfinishedPlay(play);
        MessageService.ReplyMessage(messageInfo, 'The Sudoku has been cancelled.', true, true);
        CommandManager.SetCooldown(messageInfo, 10);
        LogService.Log(LogType.SudokuStoppedSingle, guild, player, play.GetId());
    }

    private static async OnSingleplayerGame(messageInfo: IMessageInfo, guild: Guild, player: Player) {
        const sudoku = await SudokuRepository.GetRandom();
        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetSinglePlayerEmbed(sudoku, player));

        if (message != null) {
            PlayManager.StartPlay(sudoku, guild, player, messageInfo.message.createdAt, message.id, message.channel.id);
        }

        CommandManager.SetCooldown(messageInfo, 30);
    }

    private static async OnVSGame(messageInfo: IMessageInfo, guild: Guild, player: Player, opponentMention: string) {
        const member = await DiscordService.FindMember(opponentMention, messageInfo.guild);

        if (member == null) {
            MessageService.ReplyMessage(messageInfo, 'I\'m not able to find this member.', false, true);
            CommandManager.SetCooldown(messageInfo, 5);
            return;
        }

        if (member.user.id == messageInfo.user.id) {
            MessageService.ReplyMessage(messageInfo, `You can't challenge yourself. Start a singleplayer suduko with ${CommandService.GetCommandString(guild, CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PLAY[0], ['single'], true))}`, false, true);
            CommandManager.SetCooldown(messageInfo, 5);
            return;
        }

        const opponent = await this.GetPlayer(member.user, guild);

        if (opponent == null) {
            MessageService.ReplyMessage(messageInfo, 'This member is banned, so they can\'t be challenged.', false, true);
            CommandManager.SetCooldown(messageInfo, 5);
            return;
        }

        CommandManager.SetCooldown(messageInfo, 62);

        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetVSChallengeEmbed(player, opponent));
        await PlayManager.CreateChallenge(guild, message.id, player.GetDiscordId(), opponent.GetDiscordId());

        if (await DiscordService.CheckPermission(messageInfo, PermissionFlagsBits.AddReactions)) {
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

    private static async OnRoyaleGame(messageInfo: IMessageInfo, guild: Guild, player: Player) {
        const royalePlay = await PlayManager.GetRoyalePlay(guild, messageInfo.channel.id);
        if (royalePlay == true) {
            MessageService.ReplyMessage(messageInfo, 'A Battle Royale Sudoku is already about to start in this channel.', false, true);
            CommandManager.SetCooldown(messageInfo, 10);
            return;
        }

        if (royalePlay != null) {
            MessageService.ReplyEmbed(messageInfo, await PlayEmbeds.GetRoyaleReminderEmbed(royalePlay));
            CommandManager.SetCooldown(messageInfo, 10);
            return;
        }

        if (player.IsPreparingPlay()) {
            MessageService.ReplyMessage(messageInfo, 'You can\'t start a Battle Royale Sudoku as you\'re about to begin a Sudoku already!', false, true);
            CommandManager.SetCooldown(messageInfo, 10);
            return;
        }

        PlayManager.PrepareRoyalePlay(guild, player, messageInfo.channel.id);

        await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetBattleRoyaleAnnouncementEmbed());

        await Utils.Sleep(Utils.GetMinutesInSeconds(SettingsConstants.BATTLE_ROYALE_DELAY_TIME));

        const sudoku = await SudokuRepository.GetRandom();

        const message = await MessageService.ReplyEmbed(messageInfo, PlayEmbeds.GetBattleRoyaleEmbed(sudoku));

        if (message != null) {
            PlayManager.StartRoyalePlay(sudoku, guild, player, messageInfo.message.createdAt, message.id, message.channel.id);
        }

        CommandManager.SetCooldown(messageInfo, 30);
    }

    private static async GetPlayer(user: User, guild: Guild) {
        const player = await PlayerManager.GetPlayer(user.id, user.username, guild);
        if (player == null) {
            return;
        }

        return player;
    }
}