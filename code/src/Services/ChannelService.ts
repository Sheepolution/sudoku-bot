import IMessageInfo from '../Interfaces/IMessageInfo';
import ChannelRepository from '../Repositories/ChannelRepository';
import GuildRepository from '../Repositories/GuildRepository';

export default class ChannelService {
    public static async CheckChannel(messageInfo: IMessageInfo) {
        const guild = await GuildRepository.GetByDiscordId(messageInfo.guild.id);
        if (guild == null) {
            return false;
        }

        const channel = await ChannelRepository.GetByDiscordId(messageInfo.channel.id);
        if (channel == null) {
            return false;
        }

        return true;
    }
}