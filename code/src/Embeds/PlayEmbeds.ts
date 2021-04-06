import { MessageEmbed } from 'discord.js';
import EmojiConstants from '../Constants/EmojiConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import { PlayType } from '../Enums/PlayType';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import Sudoku from '../Objects/Sudoku';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import PlayRepository from '../Repositories/PlayRepository';
import { Utils } from '../Utils/Utils';

export default class PlayEmbeds {

    public static GetSinglePlayerEmbed(sudoku: Sudoku, player: Player) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Single-player Sudoku - ${player.GetName()}`)
            .setDescription(`${sudoku.GetPuzzle()}`);
        return embed;
    }

    public static GetVSEmbed(sudoku: Sudoku, player: Player, opponent: Player) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} VS ${opponent.GetName()}`)
            .setDescription(`${sudoku.GetPuzzle()}`);
        return embed;
    }

    public static GetRoyaleEmbed(sudoku: Sudoku) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Multiplayer Sudoku - Battle Royale')
            .setDescription(`${sudoku.GetPuzzle()}`);
        return embed;
    }

    public static GetVSChallengeEmbed(player: Player, opponent: Player) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} vs ${opponent.GetName()}`)
            .setDescription(`${opponent.GetName()} has ${SettingsConstants.CHALLENGE_EXPIRE_TIME_TEXT} to accept this challenge by reacting ${EmojiConstants.STATUS.GOOD} to this message.`)
            .setFooter(`The game will begin ${SettingsConstants.CHALLENGE_DELAY_TIME_TEXT} after it has been accepted`);
        return embed;
    }

    public static GetVSChallengeNotAcceptedEmbed(player: Player, opponent: Player) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} vs ${opponent.GetName()}`)
            .setDescription(`${opponent.GetName()} did not accept the challenge.`);
        return embed;
    }

    public static GetBattleRoyaleAnnouncementEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Multiplayer Sudoku - Battle Royale')
            .setDescription(`In ${SettingsConstants.BATTLE_ROYALE_DELAY_TIME_TEXT} a Battle Royale Sudoku will begin! Everyone is invited to be the first to solve the sudoku!`);
        return embed;
    }

    public static async GetSolvedEmbed(play: Play, solver: Player, guild: Guild) {
        const sudokuGuildRank = await PlayRepository.GetSudokuGuildRank(play, guild);
        const sudokuGlobalRank = await PlayRepository.GetSudokuGlobalRank(play);

        const fastestSolveGuildRank = await PlayerStatsRepository.GetFastestSolveGuildRank(solver, guild);
        const fastestSolveGlobalRank = await PlayerStatsRepository.GetFastestSolveGlobalRank(solver);

        const stats = await solver.GetStats();

        var description = `${solver.GetName()}`;

        const playType = play.GetType();
        if (playType == PlayType.Single) {
            description += ' solved the Singleplayer Sudoku!';
        } else if (playType == PlayType.VS) {
            const opponent = await play.GetOpponent(solver);
            description += ` won the Multiplayer Sudoku VS ${opponent.GetName()}!`;
        }

        description += `

**Sudoku ${(await play.GetSudoku()).GetFancyId()}**
Time: ${Utils.GetSecondsInDigitalMinutesAndSeconds(play.GetDuration())}
Server rank: #${sudokuGuildRank}
Global rank: #${sudokuGlobalRank}

**Player Stats**
Sudokus solved: ${stats.GetSolved()}
Streak: ${stats.GetStreak()}

Fastest time: ${Utils.GetSecondsInDigitalMinutesAndSeconds(stats.GetFastestSolve())}
Server rank: #${fastestSolveGuildRank}
Global rank: #${fastestSolveGlobalRank}`;

        const fastestAverageOfFive = stats.GetFastestAverageOfFive();

        if (fastestAverageOfFive != null) {
            const fastestAverageOfFiveGuildRank = await PlayerStatsRepository.GetFastestAverageOfFiveGuildRank(solver, guild);
            const fastestAverageOfFiveGlobalRank = await PlayerStatsRepository.GetFastestAverageOfFiveGlobalRank(solver);

            description += `

Current average of 5: ${Utils.GetSecondsInDigitalMinutesAndSeconds(stats.GetCurrentAverageOfFive())}
Fastest average of 5: ${Utils.GetSecondsInDigitalMinutesAndSeconds(fastestAverageOfFive)}
Server rank: #${fastestAverageOfFiveGuildRank}
Global rank: #${fastestAverageOfFiveGlobalRank}`;
        }

        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle('Solved!')
            .setDescription(description);
        return embed;
    }

    public static GetEditSinglePlayerSudokuEmbed(player: Player, messageUrl: string) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Singleplayer Sudoku - ${player.GetName()} `)
            .setDescription(`[Solved!](${messageUrl})`);
        return embed;
    }

}
