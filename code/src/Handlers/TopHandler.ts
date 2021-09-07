import CommandConstants from '../Constants/CommandConstants';
import SudokuConstants from '../Constants/SudokuConstants';
import TopListEmbeds from '../Embeds/TopListEmbed';
import { TopListScaleType } from '../Enums/TopListScaleType';
import { TopListType } from '../Enums/TopListType';
import IMessageInfo from '../Interfaces/IMessageInfo';
import PlayerManager from '../Managers/PlayerManager';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import CommandService from '../Services/CommandService';
import MessageService from '../Services/MessageService';

export default class TopHandler {

    public static OnCommand(messageInfo: IMessageInfo, guild: Guild) {
        const commands = CommandConstants.COMMANDS;
        const commandInfo = messageInfo.commandInfo;

        switch (messageInfo.commandInfo.commands) {
            case commands.TOP:
                this.OnTop(messageInfo, guild, commandInfo.args[0], commandInfo.args[1]);
                break;
            default: return false;
        }

        return true;
    }

    public static async OnTop(messageInfo: IMessageInfo, guild: Guild, what: string, where: string) {
        if (!what?.isFilled()) {
            MessageService.ReplyMessage(messageInfo, `Use this command to get a top 10 list.\n${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['time/average/Sudoku ID', 'server/global'])}`);
            return;
        }

        var type: TopListType;
        var whatLower = what.toLowerCase();
        var sudokuId: number;
        var player: Player;

        if (whatLower == 'time' || whatLower == 'fastest') {
            type = TopListType.Time;
        } else if (whatLower == 'average') {
            type = TopListType.Average;
        } else if (whatLower == 'solved' || whatLower == 'most') {
            type = TopListType.Solved;
        } else if (whatLower == 'personal') {
            type = TopListType.Personal;
            player = await PlayerManager.GetPlayer(messageInfo.user.id, messageInfo.user.username, guild);
            if (player == null) {
                MessageService.ReplyMessage(messageInfo, 'You have been banned from using this bot.', false, true);
            }
        } else {
            if (what.startsWith('#')) {
                what = what.slice(1);
            }

            const whatNumber = parseInt(what);
            if (isNaN(whatNumber)) {
                MessageService.ReplyMessage(messageInfo, `I don't know what you mean with '${whatLower}'. Use 'time', 'average', 'solved', or a Sudoku ID. (e.g. #1234).`, false, true);
                return;
            } else {
                if (whatNumber < 0 || whatNumber >= SudokuConstants.NUMBER_OF_SUDOKUS) {
                    MessageService.ReplyMessage(messageInfo, 'Sudoku IDs range between #0000 and #9999', false, true);
                    return;
                }

                type = TopListType.Sudoku;
                sudokuId = whatNumber;
            }
        }

        var scale: TopListScaleType;
        if (!where?.isFilled() || where.toLowerCase() == 'global') {
            scale = TopListScaleType.Global;
        } else if (where.toLowerCase() == 'server') {
            scale = TopListScaleType.Server;
        } else {
            MessageService.ReplyMessage(messageInfo, `I don't know what you mean with '${where}'. Use 'global' or 'server'.`, false, true);
            return;
        }

        if (type == TopListType.Time) {
            MessageService.ReplyEmbed(messageInfo, await TopListEmbeds.GetTopFastest(scale == TopListScaleType.Global ? null : guild));
        } else if (type == TopListType.Average) {
            MessageService.ReplyEmbed(messageInfo, await TopListEmbeds.GetTopFastestAverageOfFive(scale == TopListScaleType.Global ? null : guild));
        } else if (type == TopListType.Solved) {
            MessageService.ReplyEmbed(messageInfo, await TopListEmbeds.GetTopMostSolved(scale == TopListScaleType.Global ? null : guild));
        } else if (type == TopListType.Personal) {
            MessageService.ReplyEmbed(messageInfo, await TopListEmbeds.GetTopPersonalFastest(player));
        } else if (type == TopListType.Sudoku) {
            MessageService.ReplyEmbed(messageInfo, await TopListEmbeds.GetFastestSpecificSudokuSolved(sudokuId, scale == TopListScaleType.Global ? null : guild));
        }
    }
}