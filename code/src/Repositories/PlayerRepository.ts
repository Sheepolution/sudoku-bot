import SettingsConstants from '../Constants/SettingsConstants';
import { LogType } from '../Enums/LogType';
import CacheManager from '../Managers/CacheManager';
import PlayerModel from '../Models/PlayerModel';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import LogService from '../Services/LogService';
import PlayerStatsRepository from './PlayerStatsRepository';

export default class PlayerRepository {

    public static async New(discordId: string, discordName: string, guild: Guild) {
        const player = this.Make(await PlayerModel.New(discordId, discordName));
        await PlayerStatsRepository.New(player);
        LogService.Log(LogType.PlayerJoined, guild, player, null);
        CacheManager.Set(player, PlayerRepository, PlayerModel.GetByDiscordId, [discordId], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return player;
    }

    public static Make(model: PlayerModel) {
        const player = new Player();
        player.ApplyModel(model);
        return player;
    }

    public static async GetByDiscordId(discordId: string) {
        const player = await CacheManager.Get(PlayerRepository, PlayerModel.GetByDiscordId, [discordId], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return player;
    }

    public static async GetById(id: string) {
        var player = await CacheManager.Get(PlayerRepository, PlayerModel.GetById, [id], SettingsConstants.CACHE_TIMEOUT_DEFAULT);

        if (player != null) {
            CacheManager.Set(player, PlayerRepository, PlayerModel.GetByDiscordId, [player.GetDiscordId()], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        }

        return player;
    }
}