import CommandConstants from '../Constants/CommandConstants';
import GeneralEmbeds from '../Embeds/GeneralEmbeds';
import IMessageInfo from '../Interfaces/IMessageInfo';
import CommandManager from '../Managers/CommandManager';
import Guild from '../Objects/Guild';
import MessageService from '../Services/MessageService';

export default class GeneralHandler {

    public static OnCommand(messageInfo: IMessageInfo, guild: Guild) {
        const commands = CommandConstants.COMMANDS;

        switch (messageInfo.commandInfo.commands) {
            case commands.HELP:
                this.OnHelp(messageInfo, guild);
                break;
            case commands.RULES:
                this.OnRules(messageInfo);
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
            default: return false;
        }

        return true;
    }

    private static OnHelp(messageInfo: IMessageInfo, guild: Guild) {
        MessageService.ReplyEmbed(messageInfo, GeneralEmbeds.GetHelpEmbed(guild));
        CommandManager.SetCooldown(messageInfo, 10);
    }

    private static OnRules(messageInfo: IMessageInfo) {
        MessageService.ReplyEmbed(messageInfo, GeneralEmbeds.GetRulesEmbed());
        CommandManager.SetCooldown(messageInfo, 60);
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
}