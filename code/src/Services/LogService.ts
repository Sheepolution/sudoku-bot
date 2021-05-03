import { LogType } from '../Enums/LogType';
import Player from '../Objects/Player';
import LogModel from '../Models/LogModel';
import Guild from '../Objects/Guild';
import Discord from '../Providers/Discord';
import SettingsConstants from '../Constants/SettingsConstants';
import { TextChannel } from 'discord.js';
import { Utils } from '../Utils/Utils';

export default class LogService {
    private static logChannel: TextChannel;

    public static async Log(logType: LogType, guild: Guild, player?: Player, subjectId?: string) {
        await LogModel.New(guild, player, subjectId, logType);

        if (this.logChannel == null) {
            const logChannel = await Discord.GetClient().channels.fetch(SettingsConstants.LOG_CHANNEL_ID);
            this.logChannel = <TextChannel>logChannel;
        }

        this.logChannel.send(`${Utils.GetDateAsUserFriendlyString(new Date())} - ${logType}`);
    }
}