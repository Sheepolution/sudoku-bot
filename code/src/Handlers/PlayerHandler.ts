import CommandConstants from '../Constants/CommandConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import PlayerEmbeds from '../Embeds/PlayerEmbeds';
import IMessageInfo from '../Interfaces/IMessageInfo';
import PlayerManager from '../Managers/PlayerManager';
import Guild from '../Objects/Guild';
import CommandService from '../Services/CommandService';
import MessageService from '../Services/MessageService';

export default class PlayerHandler {

    public static OnCommand(messageInfo: IMessageInfo, guild: Guild) {
        const commands = CommandConstants.COMMANDS;
        const commandInfo = messageInfo.commandInfo;

        switch (messageInfo.commandInfo.commands) {
            case commands.NAME:
                this.OnName(messageInfo, guild, commandInfo.content);
                break;
            case commands.STATS:
                this.OnStats(messageInfo, guild);
                break;
            default: return false;
        }

        return true;
    }

    public static async OnName(messageInfo: IMessageInfo, guild: Guild, name: string) {
        const player = await PlayerManager.GetPlayer(messageInfo.user.id, messageInfo.user.username, guild);
        if (player == null) { return; }

        if (!name?.isFilled()) {
            MessageService.ReplyMessage(messageInfo, `Use this command to set the name for your player. Beware that offensive names might ban you from using the bot without warning.
${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.NAME[0], ['name'])}`);
            return;
        }

        const maxNameLength = SettingsConstants.MAX_NAME_LENGTH;

        if (name.length > maxNameLength) {
            MessageService.ReplyMessage(messageInfo, `Your name may not be longer than ${maxNameLength} characters, and yours is ${name.length} characters.`, false, true);
            return;
        }

        player.SetName(name, true);

        MessageService.ReplyMessage(messageInfo, `Your name has been changed to ${name}.`, true, true);
    }

    public static async OnStats(messageInfo: IMessageInfo, guild: Guild) {
        const player = await PlayerManager.GetPlayer(messageInfo.user.id, messageInfo.user.username, guild);
        if (player == null) { return; }

        MessageService.ReplyEmbed(messageInfo, await PlayerEmbeds.GetStatisticsEmbed(player, guild));
    }
}