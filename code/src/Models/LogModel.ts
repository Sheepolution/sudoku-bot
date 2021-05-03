import { Utils } from '../Utils/Utils';
import { LogType } from '../Enums/LogType';
import Player from '../Objects/Player';
import Guild from '../Objects/Guild';

const { Model } = require('objection');

export default class LogModel extends Model {

    static get tableName() {
        return 'log';
    }

    public static async New(guild?: Guild, player?: Player, subjectId?: string, logType?: LogType) {
        const logId = Utils.UUID();

        const log = await LogModel.query()
            .insert({
                id: logId,
                guild_id: guild?.GetId(),
                player_id: player?.GetId(),
                subject_id: subjectId,
                type: logType,
                log_date: Utils.GetNowString(),
            });

        return log;
    }
}