import IMessageInfo from '../Interfaces/IMessageInfo';
import SettingsConstants from '../Constants/SettingsConstants';
import DiscordService from '../Services/DiscordService';
import Guild from '../Objects/Guild';
import CommandConstants from '../Constants/CommandConstants';
import MessageService from '../Services/MessageService';
import CommandManager from '../Managers/CommandManager';
import { Utils } from '../Utils/Utils';
import CommandUtils from '../Utils/CommandUtils';
import PlayHandler from './PlayHandler';
import AdminHandler from './AdminHandler';
import TopHandler from './TopHandler';
import GeneralHandler from './GeneralHandler';
import PlayerHandler from './PlayerHandler';

export default class CommandHandler {

    public static async OnCommand(messageInfo: IMessageInfo, content: string, guild?: Guild) {
        const commandInfo = CommandUtils.ParseContentToCommand(content, guild?.GetPrefix());
        messageInfo.commandInfo = commandInfo;

        const command = this.GetCommand(commandInfo.command);

        if (command == null) {
            Utils.Log('This isn\'t an existing command!', messageInfo.user.id);
            return;
        }

        const spam = await CommandManager.CheckSpam(messageInfo);
        if (spam.spam) {
            Utils.Log('They are spamming!', messageInfo.user.id);
            if (spam.warn) {
                MessageService.ReplyMessage(messageInfo, `Please wait ${SettingsConstants.SPAM_EXPIRE_TIME} seconds before using another command.`, false, true);
            }

            return;
        }

        commandInfo.command = command[0];
        commandInfo.commands = command;

        const cooldown = await CommandManager.GetCooldown(messageInfo);

        if (cooldown.time > 0) {
            Utils.Log('There is cooldown!', messageInfo.user.id);
            if (cooldown.tell) {
                if (messageInfo.channel.type != 'dm') {
                    return;
                }

                MessageService.ReplyMessage(messageInfo, `Please wait ${Utils.GetSecondsInMinutesAndSeconds(cooldown.time)} before using this command again.`, false, true);
            }

            return;
        }

        if (DiscordService.IsMemberMod(messageInfo.message.member)) {
            if (AdminHandler.OnCommand(messageInfo, guild)) {
                return;
            }
        }

        if (PlayHandler.OnCommand(messageInfo, guild)) {
            return;
        } else if (PlayerHandler.OnCommand(messageInfo, guild)) {
            return;
        } else if (TopHandler.OnCommand(messageInfo, guild)) {
            return;
        } else if (GeneralHandler.OnCommand(messageInfo, guild)) {
            return;
        }
    }

    public static GetCommand(command: string) {
        const commandConstants = <{ [key: string]: any }>CommandConstants;

        for (const commandConstantKey in commandConstants) {
            const commandGroup = <{ [key: string]: Array<string> }>commandConstants[commandConstantKey];
            for (const commandGroupKey in commandGroup) {
                if (commandGroup[commandGroupKey].includes(command)) {
                    return commandGroup[commandGroupKey];
                }
            }
        }

        return null;
    }
}
