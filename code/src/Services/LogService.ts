import { LogType } from '../Enums/LogType';
import Player from '../Objects/Player';
import LogModel from '../Models/LogModel';
import Guild from '../Objects/Guild';

export default class LogService {
    public static async Log(logType: LogType, guild: Guild, player?: Player, subjectId?: string) {
        await LogModel.New(guild, player, subjectId, logType);
    }
}