import CommandConstants from '../Constants/CommandConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import GeneralEmbeds from '../Embeds/GeneralEmbeds';
import { LogType } from '../Enums/LogType';
import IMessageInfo from '../Interfaces/IMessageInfo';
import BotManager from '../Managers/BotManager';
import CommandManager from '../Managers/CommandManager';
import Guild from '../Objects/Guild';
import ChannelRepository from '../Repositories/ChannelRepository';
import CommandService from '../Services/CommandService';
import LogService from '../Services/LogService';
import MessageService from '../Services/MessageService';

export default class AdminHandler {

    public static OnCommand(messageInfo: IMessageInfo, guild: Guild) {
        const commands = CommandConstants.COMMANDS;
        const commandInfo = messageInfo.commandInfo;

        switch (messageInfo.commandInfo.commands) {
            case commands.HELP:
                this.OnHelp(messageInfo, guild);
                break;
            case commands.DEVELOPER:
                this.OnDeveloper(messageInfo);
                break;
            case commands.DONATE:
                this.OnDonate(messageInfo);
                break;
            case commands.INVITE:
                this.OnInvite(messageInfo);
                break;
            case commands.PREFIX:
                this.OnPrefix(messageInfo, guild, commandInfo.args[0]);
                break;
            case commands.CHANNEL:
                this.OnChannel(messageInfo, guild, commandInfo.args[0]);
                break;
            default: return false;
        }

        return true;
    }

    private static OnHelp(messageInfo: IMessageInfo, guild: Guild) {
        MessageService.ReplyEmbed(messageInfo, GeneralEmbeds.GetHelpEmbed(guild));
        CommandManager.SetCooldown(messageInfo, 10);
    }

    private static OnDeveloper(messageInfo: IMessageInfo) {
        MessageService.ReplyEmbed(messageInfo, GeneralEmbeds.GetDeveloperEmbed());
        CommandManager.SetCooldown(messageInfo, 60);
    }

    private static OnDonate(messageInfo: IMessageInfo) {
        MessageService.ReplyEmbed(messageInfo, GeneralEmbeds.GetDonationEmbed());
        CommandManager.SetCooldown(messageInfo, 60);
    }

    private static OnInvite(messageInfo: IMessageInfo) {
        MessageService.ReplyEmbed(messageInfo, GeneralEmbeds.GetInviteEmbed());
        CommandManager.SetCooldown(messageInfo, 60);
    }

    private static OnPrefix(messageInfo: IMessageInfo, guild: Guild, prefix: string) {
        if (!prefix?.isFilled()) {
            MessageService.ReplyMessage(messageInfo, 'Use this command to set the prefix for the commands.');
            return;
        }

        const maxLength = SettingsConstants.MAX_PREFIX_LENGTH;
        if (prefix.length > maxLength) {
            MessageService.ReplyMessage(messageInfo, `The prefix can't be longer than ${maxLength}.`, false, true);
            return;
        }

        guild.SetPrefix(prefix);

        BotManager.ClearPrefixCache(messageInfo);
        MessageService.ReplyMessage(messageInfo, `The prefix is now set to ${prefix}`, true, true);
        CommandManager.SetCooldown(messageInfo, 10);
    }

    private static async OnChannel(messageInfo: IMessageInfo, guild: Guild, action: string) {
        if (!action?.isFilled() || action.trim().toLowerCase() == 'add') {
            var channel = await ChannelRepository.GetByDiscordId(messageInfo.channel.id);
            if (channel != null) {
                MessageService.ReplyMessage(messageInfo, 'This channel was already added as a sudoku channel.', undefined, true);
            } else {
                ChannelRepository.New(messageInfo.channel.id, guild);
                MessageService.ReplyMessage(messageInfo, 'This channel is now a sudoku channel.', true, true);
                LogService.Log(LogType.ChannelAdded, guild);
            }
        } else if (action == 'remove') {
            var channel = await ChannelRepository.GetByDiscordId(messageInfo.channel.id);
            if (channel != null) {
                ChannelRepository.Delete(channel);
                MessageService.ReplyMessage(messageInfo, 'This channel is no longer a sudoku channel.', true, true);
                LogService.Log(LogType.ChannelRemoved, guild);
            } else {
                MessageService.ReplyMessage(messageInfo, 'This was not a sudoku channel.', undefined, true);
            }
        } else {
            MessageService.ReplyMessage(messageInfo, `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.CHANNEL[0], ['add/remove'], true)} to add or remove the channel from the list of sudoku channels.`, false, true);
            return;
        }

        CommandManager.SetCooldown(messageInfo, 10);
    }

}