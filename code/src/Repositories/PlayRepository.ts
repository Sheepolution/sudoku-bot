import SettingsConstants from '../Constants/SettingsConstants';
import { PlayType } from '../Enums/PlayType';
import CacheManager from '../Managers/CacheManager';
import PlayModel from '../Models/PlayModel';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import Sudoku from '../Objects/Sudoku';

export default class PlayRepository {

    public static async New(sudoku: Sudoku, guild: Guild, creator: Player, startDate: Date, type: PlayType, messageId: string, channelId: string, opponent?: Player) {
        const play = this.Make(await PlayModel.New(sudoku, guild, creator, startDate, type, messageId, channelId, opponent));
        CacheManager.Set(play, PlayRepository, PlayModel.GetById, [play.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        CacheManager.Set(play, PlayRepository, PlayModel.GetUnfinishedPlayByPlayerId, [creator.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        if (type == PlayType.Royale) {
            CacheManager.Set(play, PlayRepository, PlayModel.GetUnfinishedRoyalePlayByChannelId, [guild.GetId(), channelId]);
        }
        return play;
    }

    public static Make(model: PlayModel) {
        const play = new Play();
        play.ApplyModel(model);
        return play;
    }

    public static async Delete(play: Play) {
        await PlayModel.DeleteById(play.GetId());
        this.Clear(play);
    }

    public static async GetById(id: string) {
        const play = await CacheManager.Get(PlayRepository, PlayModel.GetById, [id], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return play;
    }

    public static async GetUnfinishedPlayByPlayer(player: Player) {
        const play = await CacheManager.Get(PlayRepository, PlayModel.GetUnfinishedPlayByPlayerId, [player.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return play;
    }

    public static async GetRoyalePlayByChannelId(guild: Guild, channelId: string) {
        const play = await CacheManager.Get(PlayRepository, PlayModel.GetUnfinishedRoyalePlayByChannelId, [guild.GetId(), channelId], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return play;
    }

    public static async GetPersonalPlayRank(play: Play, player: Player) {
        const rank = await PlayModel.GetPersonalPlayRank(play.GetId(), player.GetId());
        return rank;
    }

    public static async GetSudokuGuildRank(sudokuId: number, player: Player, guild: Guild) {
        const rank = await PlayModel.GetSudokuGuildRank(player.GetId(), sudokuId, guild.GetId());
        return rank;
    }

    public static async GetSudokuGlobalRank(sudokuId: number, player: Player) {
        const rank = await PlayModel.GetSudokuGlobalRank(player.GetId(), sudokuId);
        return rank;
    }

    public static async GetTopFastestSolvesGlobal() {
        const list = await PlayModel.GetTopFastestSolvesGlobal();
        return list;
    }
    public static async GetTopFastestSpecificSudokuSolves(sudokuId: number, guildId?: string) {
        const list = await PlayModel.GetTopFastestSpecificSudokuSolves(sudokuId, guildId);
        return list;
    }

    public static async GetPersonalFastestSolveList(player: Player) {
        const rank = await PlayModel.GetPersonalFastestSolveGuildList(player.GetId());
        return rank;
    }

    public static Clear(play: Play) {
        CacheManager.Clear(PlayRepository, PlayModel.GetById, [play.GetId()]);
        CacheManager.Clear(PlayRepository, PlayModel.GetUnfinishedPlayByPlayerId, [play.GetCreatorId()]);

        const playType = play.GetType();
        if (playType == PlayType.VS) {
            CacheManager.Clear(PlayRepository, PlayModel.GetUnfinishedPlayByPlayerId, [play.GetOpponentId()]);
        } else if (playType == PlayType.Royale) {
            CacheManager.Clear(PlayRepository, PlayModel.GetUnfinishedRoyalePlayByChannelId, [play.GetGuildId(), play.GetChannelId()]);
        }
    }
}