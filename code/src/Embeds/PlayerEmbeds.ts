import { MessageEmbed } from 'discord.js';
import SettingsConstants from '../Constants/SettingsConstants';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import { Utils } from '../Utils/Utils';

export default class PlayerEmbeds {

    public static GetStrikeEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle('Cheating')
            .setDescription(`You are suspected of cheating.
This is your first and final warning. If you cheat again you will be banned from using this bot.

If you believe you did not cheat you can discuss this with the developer in the [support server](${SettingsConstants.SUPPORT_SERVER_INVITE_URL}).`);
        return embed;
    }

    public static GetBannedEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Cheating')
            .setDescription(`You are suspected of cheating.
As you have been warned before, you are now banned from this bot.

If you believe you did not cheat you can discuss this with the developer in the [support server](${SettingsConstants.SUPPORT_SERVER_INVITE_URL}).`);
        return embed;
    }

    public static async GetStatisticsEmbed(player: Player, guild: Guild) {
        const fastestSolveGuildRank = await PlayerStatsRepository.GetFastestSolveGuildRank(player, guild);
        const fastestSolveGlobalRank = await PlayerStatsRepository.GetFastestSolveGlobalRank(player);

        const stats = await player.GetStats();

        var description = `
Sudokus solved: ${stats.GetSolved()}
Streak: ${stats.GetStreak()}

Fastest time: ${Utils.GetSecondsInDigitalMinutesAndSeconds(stats.GetFastestSolve())}
Server rank: #${fastestSolveGuildRank}
Global rank: #${fastestSolveGlobalRank}`;

        const fastestAverageOfFive = stats.GetFastestAverageOfFive();

        if (fastestAverageOfFive != null) {
            const fastestAverageOfFiveGuildRank = await PlayerStatsRepository.GetFastestAverageOfFiveGuildRank(player, guild);
            const fastestAverageOfFiveGlobalRank = await PlayerStatsRepository.GetFastestAverageOfFiveGlobalRank(player);

            const currentAverageOfFive = await stats.GetCurrentAverageOfFive();

            description += `
${currentAverageOfFive == null ? '' : `\nCurrent average of 5: ${Utils.GetSecondsInDigitalMinutesAndSeconds(currentAverageOfFive)}`}
Fastest average of 5: ${Utils.GetSecondsInDigitalMinutesAndSeconds(fastestAverageOfFive)}
Server rank: #${fastestAverageOfFiveGuildRank}
Global rank: #${fastestAverageOfFiveGlobalRank}`;
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Player Statistics - ${player.GetName()}`)
            .setDescription(description);
        return embed;
    }
}