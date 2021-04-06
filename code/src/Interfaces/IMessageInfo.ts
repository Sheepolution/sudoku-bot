import { Channel, Guild, Message, User } from 'discord.js';
import ICommandInfo from './ICommandInfo';

export default interface IMessageInfo {
    guild?: Guild;
    channel: Channel;
    user: User;
    message: Message;
    commandInfo?: ICommandInfo;
    edit?: boolean;
}