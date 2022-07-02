import DiscordService from './DiscordService';
import IMessageInfo from '../Interfaces/IMessageInfo';
import { MessageEmbed, TextChannel, Message } from 'discord.js';
import EmojiConstants from '../Constants/EmojiConstants';

export default class MessageService {

    public static async ReplyMessage(messageInfo: IMessageInfo, text: string, good?: boolean, mention?: boolean, embed?: MessageEmbed, oldMessage?: Message) {
        if (embed && messageInfo.guild != null) {
            if (!await DiscordService.CheckPermission(messageInfo, 'EMBED_LINKS')) {
                return;
            }
        }

        if (good != null) {
            text = (good ? EmojiConstants.STATUS.GOOD : EmojiConstants.STATUS.BAD) + ' ' + text;
        }

        const data: any = {};

        if (text?.isFilled()) {
            data.content = text;
        }

        if (embed != null) {
            data.embeds = [embed];
        }

        if (oldMessage != null) {
            return await DiscordService.EditMessage(oldMessage, data);
        }

        return await DiscordService.ReplyMessage(<TextChannel>messageInfo.channel, messageInfo.user, data);
    }

    public static async ReplyEmbed(messageInfo: IMessageInfo, embed: MessageEmbed, text?: string, oldMessage?: Message) {
        if (messageInfo.guild != null) {
            if (!await DiscordService.CheckPermission(messageInfo, 'EMBED_LINKS')) {
                return;
            }
        }

        const data: any = { embeds: [embed] };

        if (text?.isFilled()) {
            data.content = text;
        }

        if (oldMessage != null) {
            return await DiscordService.EditMessage(oldMessage, data);
        }

        return await DiscordService.SendMessage(messageInfo.channel, data);
    }
}
