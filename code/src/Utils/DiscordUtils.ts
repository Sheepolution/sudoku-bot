import { Channel, GuildMember, Interaction, Message, User } from 'discord.js';
import IMessageInfo from '../Interfaces/IMessageInfo';
import RegexConstants from '../Constants/RegexConstants';
import DiscordService from '../Services/DiscordService';

export default class DiscordUtils {

    public static IsId(id: string) {
        return id.match(RegexConstants.DISCORD_ID) != null;
    }

    public static GetMemberId(id: string) {
        if (this.IsId(id)) { return id; }

        var match = id.match(RegexConstants.MENTION);

        if (match) {
            return match[1];
        }

        return null;
    }

    public static GetChannelId(id: string) {
        if (this.IsId(id)) { return id; }

        var match = id.match(RegexConstants.CHANNEL);

        if (match) {
            return match[1];
        }

        return null;
    }

    public static GetRoleId(id: string) {
        if (this.IsId(id)) { return id; }

        var match = id.match(RegexConstants.ROLE);

        if (match) {
            return match[1];
        }

        return null;
    }

    public static ParseMessageToInfo(message: Message, user: User) {
        const info: IMessageInfo = {
            user: user,
            channel: message.channel as Channel,
            message: message,
            member: message.member,
            guild: message.guild || null,
        };

        return info;
    }

    public static async ParseInteractionToInfo(interaction: Interaction) {
        const info: IMessageInfo = {
            user: interaction.user,
            message: interaction,
            channel: await DiscordService.FindChannelById(interaction.channelId),
            guild: interaction.guildId ? await DiscordService.FindGuildById(interaction.guildId) : null,
            interaction: interaction,
            member: interaction.member == null ? null : interaction.member as GuildMember,
        };

        return info;
    }

    public static ParseChannelMentionsToIds(channels: Array<string>) {
        const ret = new Array<string>();

        for (let i = 0; i < channels.length; i++) {
            const id = this.GetChannelId(channels[i]);
            if (id) {
                ret.push(id);
            }
        }

        return ret;
    }
}