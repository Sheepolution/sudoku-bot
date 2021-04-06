import SettingsConstants from '../Constants/SettingsConstants';
import { PlayType } from '../Enums/PlayType';
import CacheManager from '../Managers/CacheManager';
import PlayModel from '../Models/PlayModel';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import Sudoku from '../Objects/Sudoku';

export default class PlayRepository {

    public static async New(sudoku: Sudoku, guild: Guild, creator: Player, startDate: Date, type: PlayType, messageId: string, opponent?: Player) {
        const play = this.Make(await PlayModel.New(sudoku, guild, creator, startDate, type, messageId, opponent));
        CacheManager.Set(play, PlayRepository, PlayModel.GetById, [play.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return play;
    }

    public static Make(model: PlayModel) {
        const play = new Play();
        play.ApplyModel(model);
        return play;
    }

    public static async Delete(play: Play) {
        await PlayModel.DeleteById(play.GetId());
        this.ClearById(play.GetId());
    }

    public static async GetById(id: string) {
        const play = await CacheManager.Get(PlayRepository, PlayModel.GetById, [id], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return play;
    }

    public static async GetSudokuGuildRank(play: Play, guild: Guild) {
        const rank = await PlayModel.GetSudokuGuildRank(play.GetId(), play.GetSudokuId(), guild.GetId());
        return rank;
    }

    public static async GetSudokuGlobalRank(play: Play) {
        const rank = await PlayModel.GetSudokuGlobalRank(play.GetId(), play.GetSudokuId());
        return rank;
    }

    public static ClearById(id: string) {
        CacheManager.Clear(PlayRepository, PlayModel.GetById, [id]);
    }
}