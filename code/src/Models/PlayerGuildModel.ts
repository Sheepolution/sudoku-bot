import { Utils } from '../Utils/Utils';
import Player from '../Objects/Player';
import Guild from '../Objects/Guild';

const { Model } = require('objection');

export default class PlayerGuildModel extends Model {

    static get tableName() {
        return 'player_guild';
    }

    public static async New(player: Player, guild: Guild) {
        const playersGuildsId = Utils.UUID();

        const play = await PlayerGuildModel.query()
            .insert({
                id: playersGuildsId,
                player_id: player.GetId(),
                guild_id: guild.GetId(),
            });

        return play;
    }

    public static async GetByPlayerIdAnGuildId(playerId: string, guildId: string) {
        return await PlayerGuildModel.query().where({ player_id: playerId, guild_id: guildId });
    }
}