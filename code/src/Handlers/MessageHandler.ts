import IMessageInfo from '../Interfaces/IMessageInfo';
import GuildRepository from '../Repositories/GuildRepository';
import ChannelService from '../Services/ChannelService';
import PlayHandler from './PlayHandler';

export default class MessageHandler {

    public static async OnMessage(messageInfo: IMessageInfo) {
        const content = messageInfo.message.content;

        if (!content.includes('+-------+')) {
            return;
        }

        if (!await ChannelService.CheckChannel(messageInfo)) {
            return;
        }

        const guild = await GuildRepository.GetByDiscordId(messageInfo.guild.id);

        PlayHandler.OnSolution(messageInfo, guild, content);
    }
}