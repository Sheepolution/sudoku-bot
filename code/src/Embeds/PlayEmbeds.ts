import { EmbedBuilder } from 'discord.js';
import CommandConstants from '../Constants/CommandConstants';
import EmojiConstants from '../Constants/EmojiConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import { PlayType } from '../Enums/PlayType';
import Guild from '../Objects/Guild';
import Play from '../Objects/Play';
import Player from '../Objects/Player';
import Sudoku from '../Objects/Sudoku';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import PlayRepository from '../Repositories/PlayRepository';
import CommandService from '../Services/CommandService';
import { Utils } from '../Utils/Utils';

export default class PlayEmbeds {

    public static GetSinglePlayerEmbed(sudoku: Sudoku, player: Player) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Singleplayer Sudoku - ${player.GetName()}`)
            .setDescription(`${sudoku.GetPuzzle()}`);
        return embed;
    }

    public static GetVSEmbed(sudoku: Sudoku, player: Player, opponent: Player) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} VS ${opponent.GetName()}`)
            .setDescription(`${sudoku.GetPuzzle()}`);
        return embed;
    }

    public static GetBattleRoyaleEmbed(sudoku: Sudoku) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Multiplayer Sudoku - Battle Royale')
            .setDescription(`${sudoku.GetPuzzle()}`);
        return embed;
    }

    public static GetVSChallengeEmbed(player: Player, opponent: Player) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} vs ${opponent.GetName()}`)
            .setDescription(`${opponent.GetName()} has ${SettingsConstants.CHALLENGE_EXPIRE_TIME_TEXT} to accept this challenge by reacting ${EmojiConstants.STATUS.GOOD} to this message.`)
            .setFooter({ text: `The Sudoku will begin ${SettingsConstants.CHALLENGE_DELAY_TIME_TEXT} after it has been accepted` });
        return embed;
    }

    public static GetVSChallengeNotAcceptedEmbed(player: Player, opponent: Player) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} vs ${opponent.GetName()}`)
            .setDescription(`${opponent.GetName()} did not accept the challenge.`);
        return embed;
    }

    public static GetVSChallengeCancelledEmbed(player: Player, opponent: Player) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle(`Multiplayer Sudoku - ${player.GetName()} vs ${opponent.GetName()}`)
            .setDescription(`${player.GetName()} cancelled the challenge.`);
        return embed;
    }

    public static GetBattleRoyaleAnnouncementEmbed() {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Multiplayer Sudoku - Battle Royale')
            .setDescription(`In ${SettingsConstants.BATTLE_ROYALE_DELAY_TIME_TEXT} a Battle Royale Sudoku will begin! Everyone is welcome to try and be the first to solve it!`);
        return embed;
    }

    public static async GetReminderEmbed(player: Player, play: Play) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle('You\'re already playing a Sudoku!')
            .setDescription(`You can't start a new Sudoku because you're still ${play.GetType() == PlayType.Royale ? 'hosting a Battle Royale Sudoku.' : `in a Multiplayer Sudoku with ${(await play.GetOpponent(player)).GetName()}`}
Someone will have to solve it before you can start a new Sudoku.
[Jump](${await play.GetMessageUrl()})`);
        return embed;
    }

    public static async GetRoyaleReminderEmbed(play: Play) {
        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle('There already is a Battle Royale!')
            .setDescription(`There is already a Battle Royale Sudoku going on in this channel.
[Jump](${await play.GetMessageUrl()})`);
        return embed;
    }

    public static async GetSolvedEmbed(play: Play, solver: Player, guild: Guild) {
        const personalPlayRank = await PlayRepository.GetPersonalPlayRank(play, solver);
        const sudokuGuildRank = await PlayRepository.GetSudokuGuildRank(play.GetSudokuId(), solver, guild);
        const sudokuGlobalRank = await PlayRepository.GetSudokuGlobalRank(play.GetSudokuId(), solver);

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

        const playDuration = play.GetDuration();

        description += `

**Time:** ${Utils.GetSecondsInDigitalMinutesAndSeconds(play.GetDuration())}
**Personal ranking:** #${personalPlayRank.rank} / ${personalPlayRank.total}

**Sudoku ${(await play.GetSudoku()).GetFancyId()}**`;

        if (playDuration < sudokuGlobalRank.duration) {
            description += ' **NEW!**';
        } else if (playDuration != sudokuGlobalRank.duration) {
            description += `\nFastest time: ${Utils.GetSecondsInDigitalMinutesAndSeconds(sudokuGlobalRank.duration)}`;
        }

        description += `
Server rank: ${sudokuGuildRank.total == 1 ? 'First solve!' : `#${sudokuGuildRank.rank} / ${sudokuGuildRank.total}`}
Global rank: ${sudokuGlobalRank.total == 1 ? 'First solve!' : `#${sudokuGlobalRank.rank} / ${sudokuGlobalRank.total}`}

**Player Stats**
Sudokus solved: ${stats.GetSolved()}
Streak: ${stats.GetStreak()}

Fastest time: ${Utils.GetSecondsInDigitalMinutesAndSeconds(stats.GetFastestSolve())}${stats.IsNewFastestSolve() ? ' **NEW**' : ''}
Server rank: #${fastestSolveGuildRank}
Global rank: #${fastestSolveGlobalRank}`;

        const fastestAverageOfFive = stats.GetFastestAverageOfFive();

        if (fastestAverageOfFive != null) {
            const fastestAverageOfFiveGuildRank = await PlayerStatsRepository.GetFastestAverageOfFiveGuildRank(solver, guild);
            const fastestAverageOfFiveGlobalRank = await PlayerStatsRepository.GetFastestAverageOfFiveGlobalRank(solver);

            const currentAverageOfFive = await stats.GetCurrentAverageOfFive();

            description += `
${currentAverageOfFive == null ? '' : `\nCurrent average of 5: ${Utils.GetSecondsInDigitalMinutesAndSeconds(currentAverageOfFive)}`}
Fastest average of 5: ${Utils.GetSecondsInDigitalMinutesAndSeconds(fastestAverageOfFive)}${stats.IsNewFastestAverageOfFive() ? ' **NEW**' : ''}
Server rank: #${fastestAverageOfFiveGuildRank}
Global rank: #${fastestAverageOfFiveGlobalRank}`;
        }

        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle('Solved!')
            .setDescription(description);

        const tips = [
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['fastest'], true)} to get a list of the fastest times.`,
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['fastest', 'server'], true)} to get a list of the fastest times of people in this server.`,
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['solved'], true)} to get a list of most Sudokus solved.`,
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['solved', 'server'], true)} to get a list of most Sudokus solved by people in this server.`,
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['average'], true)} to get a list of the fastest average of five.`,
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['average', 'server'], true)} to get a list of the fastest average of five in this server.`,
            `Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.TOP[0], ['personal'], true)} to get a list of your personal fastest times.`
        ];

        embed.setFooter({ text: `Tip: ${tips.randomChoice()}` });

        return embed;
    }

    public static async GetEditSolvedSinglePlayerSudokuEmbed(play: Play, messageUrl: string) {

        var title: string;
        var description: string;

        const playType = play.GetType();
        if (playType == PlayType.Single) {
            title = `Singleplayer Sudoku - ${(await play.GetCreator()).GetName()}`;
            description = 'Solved!';
        } else if (playType == PlayType.VS) {
            const player = await play.GetCreator();
            const opponent = await play.GetOpponent(player);
            const solver = await play.GetSolver();

            title = `Multiplayer Sudoku - ${player.GetName()} VS ${opponent}`;
            description = `Solved by ${solver.GetName()}!`;
        } else if (playType == PlayType.Royale) {
            const solver = await play.GetSolver();
            title = 'Multiplayer Sudoku - Battle Royale';
            description = `Solved by ${solver.GetName()}!`;
        }

        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle(title)
            .setDescription(`[${description}](${messageUrl})`);
        return embed;
    }

    public static async GetEditCancelledSinglePlayerSudokuEmbed(play: Play) {
        var title: string;

        const playType = play.GetType();
        if (playType == PlayType.Single) {
            title = `Singleplayer Sudoku - ${(await play.GetCreator()).GetName()}`;
        } else if (playType == PlayType.VS) {
            const player = await play.GetCreator();
            const opponent = await play.GetOpponent(player);
            title = `Multiplayer Sudoku - ${player.GetName()} VS ${opponent}`;
        } else if (playType == PlayType.Royale) {
            title = 'Multiplayer Sudoku - Battle Royale';
        }

        const embed = new EmbedBuilder()
            .setColor(SettingsConstants.COLORS.BAD)
            .setTitle(title)
            .setDescription('Cancelled');
        return embed;

    }
}
