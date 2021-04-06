import SettingsConstants from '../Constants/SettingsConstants';
import CacheManager from '../Managers/CacheManager';
import PlayerGuildModel from '../Models/PlayerGuildModel';
import PlayerModel from '../Models/PlayerModel';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';

export default class PlayerGuildRepository {

    public static async New(player: Player, guild: Guild) {
        const playerGuild = this.Make(await PlayerGuildModel.New(player, guild));
        CacheManager.Set(playerGuild, PlayerGuildRepository, PlayerGuildModel.GetByPlayerIdAnGuildId, [player.GetId(), guild.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return playerGuild;
    }

    public static Make(model: PlayerModel) {
        return model;
    }

    public static async GetByPlayerIdAndGuildId(player: Player, guild: Guild) {
        return await CacheManager.Get(PlayerGuildRepository, PlayerGuildModel.GetByPlayerIdAnGuildId, [player.GetId(), guild.GetId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
    }
}