import CommandConstants from '../Constants/CommandConstants';
import IMessageInfo from '../Interfaces/IMessageInfo';
import CacheManager from '../Managers/CacheManager';
import MasterManager from '../Managers/MasterManager';
import MessageService from '../Services/MessageService';

export default class MasterHandler {

    public static OnCommand(messageInfo: IMessageInfo) {
        const commands = CommandConstants.COMMANDS;

        switch (messageInfo.commandInfo.commands) {
            case commands.LOCK_COMMANDS:
                this.OnLockCommands(messageInfo);
                break;
            case commands.UNLOCK_COMMANDS:
                this.OnUnLockCommands(messageInfo);
                break;
            case commands.CACHE_INFO:
                this.OnCacheInfo(messageInfo);
                break;
            case commands.EMPTY_CACHE:
                this.OnEmptyCache(messageInfo);
                break;
            default:
                return false;
        }

        return true;
    }

    private static OnLockCommands(messageInfo: IMessageInfo) {
        MasterManager.SetCommandsLocked(true);
        MessageService.ReplyMessage(messageInfo, 'Events have been locked.');
    }

    private static OnUnLockCommands(messageInfo: IMessageInfo) {
        MasterManager.SetCommandsLocked(false);
        MessageService.ReplyMessage(messageInfo, 'Events have been unlocked.');
    }

    private static OnCacheInfo(messageInfo: IMessageInfo) {
        const sizeInfo = CacheManager.GetSizeInfo();
        const total = sizeInfo.total;
        delete sizeInfo.total;
        var text = 'Size of cache:\n';
        for (const name in sizeInfo) {
            text += `${name}: ${sizeInfo[name]}\n`;
        }

        text += `Total: ${total}`;

        MessageService.ReplyMessage(messageInfo, text);
    }

    private static OnEmptyCache(messageInfo: IMessageInfo) {
        CacheManager.Empty();
        MessageService.ReplyMessage(messageInfo, 'Cache has been emptied');
    }
}