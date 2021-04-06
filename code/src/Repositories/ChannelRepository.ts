import SettingsConstants from '../Constants/SettingsConstants';
import CacheManager from '../Managers/CacheManager';
import ChannelModel from '../Models/ChannelModel';
import Channel from '../Objects/Channel';
import Guild from '../Objects/Guild';

export default class ChannelRepository {

    public static async New(discordId: string, guild: Guild) {
        const channel = this.Make(await ChannelModel.New(discordId, guild));
        CacheManager.Set(channel, ChannelRepository, ChannelModel.GetByDiscordId, [discordId], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return channel;
    }

    public static Make(model: ChannelModel) {
        const channel = new Channel();
        channel.ApplyModel(model);
        return channel;
    }

    public static Delete(channel: Channel) {
        ChannelModel.DeleteById(channel.GetId());
        this.ClearById(channel.GetId());
        this.ClearByDiscordId(channel.GetDiscordId());
    }

    public static async GetOrCreateByDiscordId(discordId: string, guild: Guild) {
        var channel = await this.GetByDiscordId(discordId);

        if (channel == null) {
            channel = await this.New(discordId, guild);
        }

        return guild;
    }

    public static async GetByDiscordId(discordId: string) {
        const guild = await CacheManager.Get(ChannelRepository, ChannelModel.GetByDiscordId, [discordId], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
        return guild;
    }

    public static ClearById(id: string) {
        CacheManager.Clear(ChannelRepository, ChannelModel.GetById, [id]);
    }

    public static ClearByDiscordId(discordId: string) {
        CacheManager.Clear(ChannelRepository, ChannelModel.GetByDiscordId, [discordId]);
    }
}