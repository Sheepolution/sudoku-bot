import { Message, TextChannel } from 'discord.js';
import RedisConstants from '../Constants/RedisConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import PlayEmbeds from '../Embeds/PlayEmbeds';
import { LogType } from '../Enums/LogType';
import { PlayType } from '../Enums/PlayType';
import IMessageInfo from '../Interfaces/IMessageInfo';
import IResultInfo from '../Interfaces/IResultInfo';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import Sudoku from '../Objects/Sudoku';
import { Redis } from '../Providers/Redis';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import PlayRepository from '../Repositories/PlayRepository';
import DiscordService from '../Services/DiscordService';
import LogService from '../Services/LogService';
import { Utils } from '../Utils/Utils';

export default class PlayManager {

    private static readonly sudokuKey = RedisConstants.REDIS_KEY + RedisConstants.SUDOKU_KEY + RedisConstants.PLAYER_KEY;
    private static readonly challengeKey = RedisConstants.REDIS_KEY + RedisConstants.CHALLENGE_KEY + RedisConstants.GUILD_KEY;
    private static readonly royaleKey = RedisConstants.REDIS_KEY + RedisConstants.ROYALE_KEY + RedisConstants.GUILD_KEY;

    public static async CreateChallenge(guild: Guild, messageId: string, playerId: string, opponentId: string) {
        await Redis.hset(this.GetChallengeKey(guild, messageId), 'player_id', playerId, 'opponent_id', opponentId);
    }

    public static async GetChallenge(guild: Guild, messageId: string) {
        return await Redis.hgetall(this.GetChallengeKey(guild, messageId));
    }

    public static async DeleteChallenge(guild: Guild, messageId: string) {
        return await Redis.del(this.GetChallengeKey(guild, messageId));
    }

    public static async FindExistingChallenge(guild: Guild, player: Player) {
        const keys = await Redis.keys(`${this.challengeKey}${guild.GetId()}*`);

        const discordId = player.GetDiscordId();
        for (const key of keys) {
            const redisPlayerId = await Redis.hmget(key, 'player_id');
            if (discordId == redisPlayerId[0]) {
                return true;
            }
        }

        return false;
    }

    public static async GetPlay(player: Player) {
        var play: Play;

        const id = await Redis.get(this.GetSudokuKey(player));
        if (id != null) {
            play = await PlayRepository.GetById(id);
            if (play != null) {
                if (!this.HandleExpiredPlay(play)) {
                    return play;
                } else {
                    return null;
                }
            }
        }

        play = await PlayRepository.GetUnfinishedPlayByPlayer(player);

        if (play == null) {
            return null;
        }

        if (!this.HandleExpiredPlay(play)) {
            return play;
        }

        return null;
    }

    public static async GetRoyalePlay(guild: Guild, channelId: string) {
        var play: Play;

        const id = await Redis.get(this.GetRoyaleKey(guild, channelId));
        if (id != null) {
            if (id == '1') {
                return true;
            }

            play = await PlayRepository.GetById(id);
            if (play != null) {
                if (!this.HandleExpiredPlay(play)) {
                    return play;
                } else {
                    return null;
                }
            }
        }

        play = await PlayRepository.GetRoyalePlayByChannelId(guild, channelId);

        if (play == null) {
            return null;
        }

        if (!this.HandleExpiredPlay(play)) {
            return play;
        } else {
            return null;
        }
    }

    public static async StartPlay(sudoku: Sudoku, guild: Guild, player: Player, createdAt: Date, messageId: string, channelId: string) {
        const play = await PlayRepository.New(sudoku, guild, player, createdAt, PlayType.Single, messageId, channelId);
        Redis.set(this.GetSudokuKey(player), play.GetId(), 'EX', Utils.GetHoursInSeconds(24));
        LogService.Log(LogType.SudokuStartedSingle, guild, player, play.GetId());
    }

    public static async StartVSPlay(sudoku: Sudoku, guild: Guild, player: Player, opponent: Player, createdAt: Date, messageId: string, channelId: string) {
        const play = await PlayRepository.New(sudoku, guild, player, createdAt, PlayType.VS, messageId, channelId, opponent);
        Redis.set(this.GetSudokuKey(player), play.GetId(), 'EX', Utils.GetHoursInSeconds(24));
        Redis.set(this.GetSudokuKey(opponent), play.GetId(), 'EX', Utils.GetHoursInSeconds(24));
        LogService.Log(LogType.SudokuStartedVS, guild, player, play.GetId());
    }

    public static PrepareRoyalePlay(guild: Guild, player: Player, channelId: string) {
        player.SetPreparingPlay(true);
        Redis.set(this.GetRoyaleKey(guild, channelId), '1', 'EX', Utils.GetMinutesInSeconds(SettingsConstants.BATTLE_ROYALE_DELAY_TIME));
    }

    public static async StartRoyalePlay(sudoku: Sudoku, guild: Guild, player: Player, createdAt: Date, messageId: string, channelId: string) {
        player.SetPreparingPlay(false);
        const play = await PlayRepository.New(sudoku, guild, player, createdAt, PlayType.Royale, messageId, channelId);
        Redis.set(this.GetRoyaleKey(guild, channelId), play.GetId(), 'EX', Utils.GetMinutesInSeconds(1));
        LogService.Log(LogType.SudokuStartedRoyale, guild, player, play.GetId());
    }

    public static async IsPlayerPlaying(guild: Guild, player: Player) {
        const id = await Redis.get(this.GetSudokuKey(player));
        return id != null;
    }

    public static async SolvePlay(messageInfo: IMessageInfo, play: Play, solution: string, guild: Guild, player: Player, channelId: string) {
        const resultInfo: IResultInfo = { result: false };

        if (play.IsSolved()) {
            resultInfo.reason = 'The Sudoku has already been solved.';
            return;
        }

        const sudoku = await play.GetSudoku();

        if (sudoku.CheckSolution(solution)) {
            if (!await play.OnSolve(player, messageInfo.edit ? (messageInfo.message as Message).editedAt : messageInfo.message.createdAt)) {
                await player.OnCheating();

                LogService.Log(LogType.PlayerStriked, guild, player);

                if (player.IsBanned()) {
                    LogService.Log(LogType.PlayerBanned, guild, player);
                }

                this.HandleUnfinishedPlay(play);
                resultInfo.reason = 'cheated';
                return resultInfo;
            }

            const playerStats = await player.GetStats();
            await playerStats.OnSolve(play);

            PlayRepository.Clear(play);

            const playType = play.GetType();
            if (playType == PlayType.VS) {
                const opponent = await play.GetOpponent(player);
                await Redis.del(this.GetSudokuKey(player));
                await Redis.del(this.GetSudokuKey(opponent));
                LogService.Log(LogType.SudokuSolvedVS, guild, player, play.GetId());
            } else if (playType == PlayType.Royale) {
                await Redis.del(this.GetRoyaleKey(guild, channelId));
                LogService.Log(LogType.SudokuSolvedRoyale, guild, player, play.GetId());
            } else {
                await Redis.del(this.GetSudokuKey(player));
                LogService.Log(LogType.SudokuSolvedSingle, guild, player, play.GetId());
            }

            resultInfo.data = { play: play };
            resultInfo.result = true;
        } else {
            resultInfo.reason = 'Incorrect!';
        }

        return resultInfo;
    }

    public static HandleExpiredPlay(play: Play) {
        if (!play.IsExpired()) {
            return false;
        }

        this.HandleUnfinishedPlay(play);
        return true;
    }

    public static async HandleUnfinishedPlay(play: Play) {
        await PlayRepository.Delete(play);
        if (play.GetType() == PlayType.Single) {
            const player = await play.GetCreator();
            const playerStats = await PlayerStatsRepository.GetByPlayerId(player.GetId());
            await playerStats.ResetStreak();
        }

        await Redis.del(this.GetSudokuKey(await play.GetCreator()));
        this.ModifyCancelledPlayMessage(play);
    }

    public static async ModifyCancelledPlayMessage(play: Play) {
        const guild = await play.GetGuild();
        const discordGuild = await DiscordService.FindGuildById(guild.GetDiscordId());
        const channel: TextChannel = <TextChannel>await DiscordService.FindChannelById(play.GetChannelId(), discordGuild);

        if (channel == null) {
            return;
        }

        const message = channel.messages.cache.get(play.GetMessageId());
        if (message != null) {
            try {
                message.edit({ embeds: [await PlayEmbeds.GetEditCancelledSinglePlayerSudokuEmbed(play)] });
            } catch (error) {
                // Whatever
            }
        }
    }

    private static GetSudokuKey(player: Player) {
        return this.sudokuKey + player.GetId();
    }

    private static GetChallengeKey(guild: Guild, messageId: string) {
        return this.challengeKey + guild.GetId() + RedisConstants.MESSAGE_KEY + messageId;
    }

    private static GetRoyaleKey(guild: Guild, channelId: string) {
        return this.royaleKey + guild.GetId() + RedisConstants.CHANNEL_KEY + channelId;
    }
}