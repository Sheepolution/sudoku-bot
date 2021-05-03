import { Utils } from '../Utils/Utils';
import { PlayerState } from '../Enums/PlayerState';

const { Model } = require('objection');

export default class PlayerModel extends Model {

    static get tableName() {
        return 'player';
    }

    public static async New(discordId: string, name: string) {
        const playerId = Utils.UUID();

        const player = await PlayerModel.query()
            .insert({
                id: playerId,
                discord_id: discordId,
                state: PlayerState.Active,
                join_date: Utils.GetNowString(),
                name: name,
                custom_name: false,
            });

        return player;
    }

    public static async GetByDiscordId(discordId: string) {
        const model: PlayerModel = await PlayerModel.query().where('discord_id', discordId).first();
        return model;
    }

    public static async GetById(id: string) {
        const model: PlayerModel = await PlayerModel.query().findById(id);
        return model;
    }

    public async Update(data: any, trx?: any) {
        await PlayerModel.query(trx)
            .findById(this.id)
            .patch(data);
    }

    public GetState() {
        switch (this.state) {
            case '0': return PlayerState.Active;
            case '1': return PlayerState.Banned;
            default: return PlayerState.Active;
        }
    }
}