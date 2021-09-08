import { MessageEmbed } from 'discord.js';
import SettingsConstants from '../Constants/SettingsConstants';
import { TopListScaleType } from '../Enums/TopListScaleType';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import PlayRepository from '../Repositories/PlayRepository';
import { Utils } from '../Utils/Utils';

export default class TopListEmbeds {

    public static async GetTopFastest(guild?: Guild) {
        const list = guild == null ? await PlayerStatsRepository.GetFastestSolveGlobalList() : await PlayerStatsRepository.GetFastestSolveGuildList(guild);

        var description = '**Rank**ᅠ**Time** ᅠ ᅠ**Player**\n―――――――――――――――\n';

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            description += `**#${i + 1}.**${i == 9 ? '' : ' '}ᅠ${i == 9 ? '' : ' '}\`${Utils.GetSecondsInDigitalMinutesAndSeconds(item.duration)}\` ᅠ ${item.name}\n`;
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Top Fastest Solves - ${guild == null ? TopListScaleType.Global : TopListScaleType.Server}`)
            .setDescription(description);

        return embed;
    }

    public static async GetFastestSpecificSudokuSolved(sudokuId: number, guild?: Guild) {
        const list = await PlayRepository.GetTopFastestSpecificSudokuSolves(sudokuId, guild?.GetId());

        if (list.length > 0) {
            var description = '**Rank**ᅠ**Time** ᅠ ᅠ**Player**\n―――――――――――――――\n';

            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                description += `**#${i + 1}.**${i == 9 ? '' : ' '}ᅠ${i == 9 ? '' : ' '}\`${Utils.GetSecondsInDigitalMinutesAndSeconds(item.duration)}\` ᅠ ${item.name}\n`;
            }
        } else {
            description = 'No solves yet!';
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Top Fastest Solves for Sudoku #${sudokuId} - ${guild == null ? TopListScaleType.Global : TopListScaleType.Server}`)
            .setDescription(description);

        return embed;
    }

    public static async GetTopFastestAverageOfFive(guild?: Guild) {
        const list = guild == null ? await PlayerStatsRepository.GetFastestAverageOfFiveGlobalList() : await PlayerStatsRepository.GetFastestAverageOfFiveGuildList(guild);

        var description = '**Rank**ᅠ**Time** ᅠ ᅠ**Player**\n―――――――――――――――\n';

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            description += `**#${i + 1}.**${i == 9 ? '' : ' '}ᅠ${i == 9 ? '' : ' '}\`${Utils.GetSecondsInDigitalMinutesAndSeconds(item.duration)}\` ᅠ ${item.name}\n`;
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Top Fastest Average of Five - ${guild == null ? TopListScaleType.Global : TopListScaleType.Server}`)
            .setDescription(description);

        return embed;
    }

    public static async GetTopMostSolved(guild?: Guild) {
        const list = guild == null ? await PlayerStatsRepository.GetMostSolvedGlobalList() : await PlayerStatsRepository.GetMostSolvedGuildList(guild);

        var description = '**Rank**ᅠ**Solved** ᅠ ᅠ**Player**\n―――――――――――――――\n';

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            description += `**#${i + 1}.**${i == 9 ? '' : ' '}ᅠ${i == 9 ? '' : ' '}\`${item.solved}\` ᅠ ${item.name}\n`;
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Top Most Solved - ${guild == null ? TopListScaleType.Global : TopListScaleType.Server}`)
            .setDescription(description);

        return embed;
    }

    public static async GetTopPersonalFastest(player: Player) {
        const list = await PlayRepository.GetPersonalFastestSolvesList(player);

        var description = '**Rank**ᅠ**Time** ᅠ ᅠ**Sudoku**\n―――――――――――――――\n';

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            description += `**#${i + 1}.**${i == 9 ? '' : ' '}ᅠ${i == 9 ? '' : ' '}\`${Utils.GetSecondsInDigitalMinutesAndSeconds(item.duration)}\` ᅠ #${item.sudoku_id}\n`;
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Top Fastest Personal Solves')
            .setDescription(description);

        return embed;
    }
}