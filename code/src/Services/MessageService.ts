import DiscordService from './DiscordService';
import IMessageInfo from '../Interfaces/IMessageInfo';
import { TextChannel, MessageEmbed, Message } from 'discord.js';
import EmojiConstants from '../Constants/EmojiConstants';

export default class MessageService {

    public static async ReplyMessage(messageInfo: IMessageInfo, text: string, good?: boolean, mention?: boolean, embed?: MessageEmbed, oldMessage?: Message) {
        if (embed) {
            if (!await DiscordService.CheckChannelPermission(messageInfo.channel, messageInfo.guild, 'EMBED_LINKS')) {
                return;
            }
        }

        if (good != null) {
            text = (good ? EmojiConstants.STATUS.GOOD : EmojiConstants.STATUS.BAD) + ' ' + text;
        }

        if (oldMessage != null) {
            return DiscordService.EditMessage(oldMessage, text, messageInfo.user, embed);
        }

        if (mention) {
            return DiscordService.ReplyMessage(<TextChannel>messageInfo.channel, messageInfo.user, text, embed);
        } else {
            return DiscordService.SendMessage(<TextChannel>messageInfo.channel, text, embed);
        }
    }

    public static async ReplyEmbed(messageInfo: IMessageInfo, embed: MessageEmbed, text?: string, oldMessage?: Message) {
        if (!await DiscordService.CheckChannelPermission(messageInfo.channel, messageInfo.guild, 'EMBED_LINKS')) {
            return;
        }

        if (oldMessage != null) {
            return DiscordService.EditMessage(oldMessage, text, null, embed);
        }

        return DiscordService.SendEmbed(messageInfo.channel, embed, text);
    }
}
