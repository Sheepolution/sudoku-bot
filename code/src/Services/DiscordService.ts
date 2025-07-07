import { Channel, Client, Guild, GuildChannelResolvable, GuildMember, Message, MessageCreateOptions, MessageEditOptions, PermissionFlagsBits, PermissionResolvable, Snowflake, TextChannel, User } from 'discord.js';
import IMessageInfo from '../Interfaces/IMessageInfo';
import DiscordUtils from '../Utils/DiscordUtils';
import MessageService from './MessageService';

export default class DiscordService {

    private static client: Client;

    public static SetClient(client: Client) {
        if (this.client != null) {
            throw new Error('Client can only be set once.');
        }

        this.client = client;
    }

    public static async FindBotMember(guild: Guild) {
        return await DiscordService.FindMemberById(this.client.user.id, guild);
    }

    public static async FindMember(searchKey: string, guild: Guild) {
        const foundMember = await this.FindMemberById(searchKey, guild);
        if (foundMember) {
            return foundMember;
        }

        // await guild.members.fetch();

        // const lowerMember = searchKey.toLowerCase();
        // return guild.members.cache.find(member => {
        //     return member.displayName.toLowerCase() == lowerMember || member.user.username.toLowerCase() == lowerMember;
        // });
    }

    public static async FindMemberById(searchKey: string, guild: Guild) {
        const id = DiscordUtils.GetMemberId(searchKey);
        if (id) {
            const foundMember = await guild.members.fetch(id);
            if (foundMember != null) {
                return foundMember;
            }
        }
    }

    public static FindChannel(channelId: string, guild?: Guild) {
        var channel = this.FindChannelById(channelId, guild);

        if (channel == null && guild != null) {
            // Guild has already been fetched in FindChannelById
            return guild.channels.cache.find(channel => channel.name.toLowerCase() == channelId.toLowerCase());
        }
        return null;
    }

    public static async FindChannelById(searchKey: string, guild?: Guild) {
        const id = DiscordUtils.GetChannelId(searchKey);
        if (id) {
            var foundChannel;
            if (guild) {
                foundChannel = guild.channels.cache.get(id);
                if (!foundChannel) {
                    await guild.fetch();
                    foundChannel = guild.channels.cache.get(id);
                }
            } else {
                foundChannel = await this.client.channels.fetch(id);
            }

            if (foundChannel != null) {
                return foundChannel;
            }
        }
    }

    public static async FindRole(searchKey: string, guild: Guild) {
        const foundRole = await this.FindRoleById(searchKey, guild);
        if (foundRole) {
            return foundRole;
        }

        await guild.roles.fetch();

        const lowerRole = searchKey.toLowerCase();
        return guild.roles.cache.find(role => role.name.toLowerCase() == lowerRole);
    }

    public static async FindRoleById(searchKey: string, guild: Guild) {
        const id = DiscordUtils.GetRoleId(searchKey);
        if (id) {
            return await guild.roles.fetch(id);
        }
    }

    public static async CreateRole(data: any, guild: Guild) {
        return guild.roles.create(data);
    }

    public static async FindMessageById(messageId: string, channel: TextChannel) {
        try {
            return await channel.messages.fetch(messageId);
        } catch (error) {
            return null;
        }
    }

    public static async FindUserById(userId: string) {
        try {
            return await this.client.users.fetch(userId);
        } catch (error) {
            return null;
        }
    }

    public static async FindGuildById(guildId: string) {
        return await this.client.guilds.fetch(guildId as Snowflake);
    }

    public static IsMemberAdmin(member: GuildMember) {
        return member.permissions.has(PermissionFlagsBits.Administrator);
    }

    public static IsMemberMod(member: GuildMember) {
        return member.permissions.has(PermissionFlagsBits.ManageChannels) || member.permissions.has(PermissionFlagsBits.ManageMessages) || member.permissions.has(PermissionFlagsBits.ManageRoles);
    }

    public static async CheckPermission(messageInfo: IMessageInfo, permission: PermissionResolvable, action?: string, sendMessage: boolean = true) {
        if (messageInfo.guild == null) {
            return;
        }

        const botMember = await DiscordService.FindBotMember(messageInfo.guild);
        const permissions = botMember.permissionsIn(messageInfo.channel as GuildChannelResolvable);
        if (permissions.has(permission)) {
            return true;
        }

        if (sendMessage) {
            MessageService.ReplyMessage(messageInfo, 'I\'m missing a permission to do this action.');
        }

        return false;
    }

    public static async SendMessage(channel: Channel, data: MessageCreateOptions) {
        try {
            const textChannel: TextChannel = <TextChannel>channel;
            return await textChannel.send(data);
        } catch (error) {
            // Was not able to send message.
        }
    }

    public static async ReplyMessage(textChannel: TextChannel, user: User, data: any) {
        try {
            data.content = `<@${user.id}> ${data.content || ''}`;

            return await textChannel.send(data);
        } catch (error) {
            // Was not able to send message.
        }
    }

    public static async EditMessage(oldMessage: Message, data: MessageEditOptions) {
        try {
            return await oldMessage.edit(data);
        } catch (error) {
            // Was not able to send message.
        }
    }

    public static async RemoveAllReactions(messageInfo: IMessageInfo, message: Message) {
        if (await DiscordService.CheckPermission(messageInfo, PermissionFlagsBits.ManageMessages)) {
            await message.reactions.removeAll().catch();
        }
    }
}