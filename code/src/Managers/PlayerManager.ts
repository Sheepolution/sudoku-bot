import Guild from '../Objects/Guild';
import PlayerRepository from '../Repositories/PlayerRepository';

export default class PlayerManager {
    public static async GetPlayer(discordId: string, discordName: string, guild: Guild) {
        const player = await PlayerRepository.GetByDiscordId(discordId);
        if (player == null) {
            return await PlayerRepository.New(discordId, discordName, guild);
        } else {
            // if (player.IsBanned()) {
            // return null;
            // }

            return player;
        }
    }
}