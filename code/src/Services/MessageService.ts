import DiscordService from './DiscordService';
import IMessageInfo from '../Interfaces/IMessageInfo';
import { EmbedBuilder, TextChannel, Message, PermissionFlagsBits, CommandInteraction } from 'discord.js';
import EmojiConstants from '../Constants/EmojiConstants';

export default class MessageService {

    public static async ReplyMessage(messageInfo: IMessageInfo, text: string, good?: boolean, mention?: boolean, embed?: EmbedBuilder, oldMessage?: Message) {
        if (embed && messageInfo.guild != null) {
            if (!await DiscordService.CheckPermission(messageInfo, PermissionFlagsBits.EmbedLinks)) {
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

        if (messageInfo.interaction != null) {
            if (good == false) {
                data.ephemeral = true;
            }

            await (messageInfo.interaction as CommandInteraction).reply(data);
            if (!data.ephemeral) {
                return await (messageInfo.interaction as CommandInteraction).fetchReply();
            }

            return;
        }

        return await DiscordService.ReplyMessage(<TextChannel>messageInfo.channel, messageInfo.user, data);
    }

    public static async ReplyEmbed(messageInfo: IMessageInfo, embed: EmbedBuilder, text?: string, oldMessage?: Message) {
        if (messageInfo.guild != null) {
            if (!await DiscordService.CheckPermission(messageInfo, PermissionFlagsBits.EmbedLinks)) {
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

        if (messageInfo.interaction != null) {
            await (messageInfo.interaction as CommandInteraction).reply(data);
            if (!data.ephemeral) {
                return await (messageInfo.interaction as CommandInteraction).fetchReply();
            }

            return;
        }

        return await DiscordService.SendMessage(messageInfo.channel, data);
    }
}
