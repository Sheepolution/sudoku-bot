import Guild from '../Objects/Guild';
import PlayerGuildRepository from '../Repositories/PlayerGuildRepository';
import PlayerRepository from '../Repositories/PlayerRepository';

export default class PlayerManager {

    public static async GetPlayer(discordId: string, discordName: string, guild: Guild) {
        let player = await PlayerRepository.GetByDiscordId(discordId);
        if (player == null) {
            player = await PlayerRepository.New(discordId, discordName, guild);
        } else {
            if (player.IsBanned()) {
                return null;
            }

            await player.SetName(discordName, false);

        }

        const playerGuild = await PlayerGuildRepository.GetByPlayerIdAndGuildId(player, guild);
        if (playerGuild == null) {
            PlayerGuildRepository.New(player, guild);
        }

        return player;
    }
}