import SettingsConstants from '../Constants/SettingsConstants';
import CacheManager from '../Managers/CacheManager';
import PlayerStatsModel from '../Models/PlayerStatsModel';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import PlayerStats from '../Objects/PlayerStats';

export default class PlayerStatsRepository {

    public static async New(player: Player) {
        const play = this.Make(await PlayerStatsModel.New(player));
        CacheManager.Set(play, PlayerStatsRepository, PlayerStatsModel.GetByPlayerId, [player.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return play;
    }

    public static Make(model: PlayerStatsModel) {
        const playerStats = new PlayerStats();
        playerStats.ApplyModel(model);
        return playerStats;
    }

    public static Delete(play: Play) {
        PlayerStatsModel.DeleteById(play.GetId());
        this.ClearById(play.GetId());
    }

    public static async GetByPlayerId(playerId: string) {
        const playerStats = await CacheManager.Get(PlayerStatsRepository, PlayerStatsModel.GetByPlayerId, [playerId], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return playerStats;
    }

    public static async GetFastestSolveGuildRank(player: Player, guild: Guild) {
        const rank = await PlayerStatsModel.GetFastestSolveGuildRank(player.GetId(), guild.GetId());
        return rank;
    }

    public static async GetFastestSolveGlobalRank(player: Player) {
        const rank = await PlayerStatsModel.GetFastestSolveGlobalRank(player.GetId());
        return rank;
    }

    public static async GetFastestAverageOfFiveGuildRank(player: Player, guild: Guild) {
        const rank = await PlayerStatsModel.GetFastestAverageOfFiveGuildRank(player.GetId(), guild.GetId());
        return rank;
    }

    public static async GetFastestAverageOfFiveGlobalRank(player: Player) {
        const rank = await PlayerStatsModel.GetFastestAverageOfFiveGlobalRank(player.GetId());
        return rank;
    }

    public static ClearById(id: string) {
        CacheManager.Clear(PlayerStatsRepository, PlayerStatsModel.GetById, [id]);
    }
}