import RedisConstants from '../Constants/RedisConstants';
import { PlayType } from '../Enums/PlayType';
import IMessageInfo from '../Interfaces/IMessageInfo';
import IResultInfo from '../Interfaces/IResultInfo';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import Sudoku from '../Objects/Sudoku';
import { Redis } from '../Providers/Redis';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import PlayRepository from '../Repositories/PlayRepository';
import { Utils } from '../Utils/Utils';

export default class PlayManager {

    private static readonly sudokuKey = RedisConstants.REDIS_KEY + RedisConstants.SUDOKU_KEY + RedisConstants.GUILD_KEY;
    private static readonly challengeKey = RedisConstants.REDIS_KEY + RedisConstants.CHALLENGE_KEY + RedisConstants.GUILD_KEY;

    public static async CreateChallenge(guild: Guild, messageId: string, playerId: string, opponentId: string) {
        await Redis.hset(this.GetChallengeKey(guild, messageId), 'player_id', playerId, 'opponent_id', opponentId);
    }

    public static async GetChallenge(guild: Guild, messageId: string) {
        return await Redis.hgetall(this.GetChallengeKey(guild, messageId));
    }

    public static async DeleteChallenge(guild: Guild, messageId: string) {
        return await Redis.del(this.GetChallengeKey(guild, messageId));
    }

    public static async GetPlay(guild: Guild, player: Player) {
        const id = await Redis.get(this.GetSudokuKey(guild, player));
        if (id != null) {
            const play = await PlayRepository.GetById(id);
            if (play != null) {
                return play;
            }
        }

        return null;
    }

    public static async StartPlay(sudoku: Sudoku, guild: Guild, player: Player, createdAt: Date, messageId: string) {
        this.HandleUnfinishedPlay(guild, player);
        const play = await PlayRepository.New(sudoku, guild, player, createdAt, PlayType.Single, messageId);
        Redis.set(this.GetSudokuKey(guild, player), play.GetId(), 'EX', Utils.GetHoursInSeconds(24));
    }

    public static async StartVSPlay(sudoku: Sudoku, guild: Guild, player: Player, opponent: Player, createdAt: Date, messageId: string) {
        const idPlayerPlay = await Redis.get(this.GetSudokuKey(guild, player));
        if (idPlayerPlay != null) {
            const play = await PlayRepository.GetById(idPlayerPlay);
            if (play != null) {
                await PlayRepository.Delete(play);
            }
        }

        const idOpponentPlay = await Redis.get(this.GetSudokuKey(guild, player));
        if (idOpponentPlay != null) {
            const play = await PlayRepository.GetById(idOpponentPlay);
            if (play != null) {
                await PlayRepository.Delete(play);
            }
        }

        const play = await PlayRepository.New(sudoku, guild, player, createdAt, PlayType.VS, messageId, opponent);
        Redis.set(this.GetSudokuKey(guild, player), play.GetId(), 'EX', Utils.GetHoursInSeconds(24));
        Redis.set(this.GetSudokuKey(guild, opponent), play.GetId(), 'EX', Utils.GetHoursInSeconds(24));
    }

    public static async IsPlayerPlaying(guild: Guild, player: Player) {
        const id = await Redis.get(this.GetSudokuKey(guild, player));
        return id != null;
    }

    public static async SolvePlay(messageInfo: IMessageInfo, solution: string, guild: Guild, player: Player) {
        const resultInfo: IResultInfo = { result: false };
        const id = await Redis.get(this.GetSudokuKey(guild, player));
        if (id == null) {
            resultInfo.reason = 'The sudoku you\'re trying to solve is not meant for you, or has already been solved.';
            return resultInfo;
        }

        const play = await PlayRepository.GetById(id);
        if (play == null) {
            resultInfo.reason = 'The sudoku you\'re trying to solve is not meant for you, or has already been solved.';
            return resultInfo;
        }

        const sudoku = await play.GetSudoku();
        var solved = sudoku.CheckSolution(solution);

        if (!play.IsSolved()) {
            resultInfo.reason = 'The sudoku has already been solved';
            return;
        }

        if (solved) {
            await play.OnSolve(player, messageInfo.edit ? messageInfo.message.editedAt : messageInfo.message.createdAt);

            const playerStats = await player.GetStats();
            await playerStats.OnSolve(play);

            PlayRepository.ClearById(play.GetId());
            await Redis.del(this.GetSudokuKey(guild, player));
            if (play.GetType() == PlayType.VS) {
                const opponent = await play.GetOpponent(player);
                await Redis.del(this.GetSudokuKey(guild, opponent));
            }

            resultInfo.data = { play: play };
            resultInfo.result = true;
        } else {
            resultInfo.reason = 'Incorrect!';
        }

        return resultInfo;
    }

    private static async HandleUnfinishedPlay(guild: Guild, player: Player) {
        const id = await Redis.get(this.GetSudokuKey(guild, player));
        if (id != null) {
            const play = await PlayRepository.GetById(id);
            if (play != null) {
                await PlayRepository.Delete(play);
                const playerStats = await PlayerStatsRepository.GetByPlayerId(player.GetId());
                await playerStats.ResetStreak();
            }
        }
    }

    private static GetSudokuKey(guild: Guild, player: Player) {
        return this.sudokuKey + guild.GetId() + RedisConstants.PLAYER_KEY + player.GetId();
    }

    private static GetChallengeKey(guild: Guild, messageId: string) {
        return this.challengeKey + guild.GetId() + RedisConstants.MESSAGE_KEY + messageId;
    }
}