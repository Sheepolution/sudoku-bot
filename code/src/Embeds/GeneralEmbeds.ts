import { MessageEmbed } from 'discord.js';
import CommandConstants from '../Constants/CommandConstants';
import EmojiConstants from '../Constants/EmojiConstants';
import ImageConstants from '../Constants/ImageConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import Guild from '../Objects/Guild';
import CommandService from '../Services/CommandService';

export default class GeneralEmbeds {

    public static GetHelpEmbed(guild?: Guild, isMod?: boolean) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Help')
            .setDescription(`${SettingsConstants.BOT_NAME} is a Discord bot for playing Sudoku.
${isMod ? `
**Setup**
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.CHANNEL[0], ['add'])} in the channels where members should be allowed to play Sudoku.
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PREFIX[0], ['prefix'])} to set the prefix for the commands.
` : ''}
**Playing Sudoku**
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PLAY[0])} to get a Sudoku to solve.
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PLAY[0], ['vs @person'])} to challenge someone.
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PLAY[0], ['royale'])} to challenge everyone.

You will need a streak of at least 5 solves to set a time for your Fastest Average of Five. Only Singleplayer Sudoku will extend your streak.
Starting a Singleplayer Sudoku but not finishing it in ${SettingsConstants.PLAY_EXPIRE_TIME_TEXT} will reset your streak.

**Statistics**
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.STATS[0])} to get your statistics.

**Name**
Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.NAME[0])} to set a custom name to use on the leaderboards instead of your Discord username.

For information about the rules use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.RULES[0])}.
For information about the developer use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.DEVELOPER[0])}.
For information about donating use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.DONATE[0])} ${EmojiConstants.HEART}.

If you have a question or want to report a problem, you can contact the developer in the [support server](${SettingsConstants.SUPPORT_SERVER_INVITE_URL}).
You can use [this](${SettingsConstants.BOT_INVITE_URL}) link to add the bot to your own server.
`);
        return embed;
    }

    public static GetRulesEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle('Rules')
            .setDescription(`Though it's not always possible to detect whether someone cheats, we would appreciate it if you would follow these rules. Breaking these rules may result in a ban, which prevents you from using this bot in the future.

**#1.** It is allowed to use any tool to solve the Sudokus, as long as that tool does not tell you what number goes where. The tool is allowed to highlight all the occurences of a number, and give you the possibility to add pencil markers.

**#2.** It is not allowed to use this bot with an offensive username, as this name might appear on the leaderboard for others to read. Follow the Discord guidelines and you should be fine.
`)
            .setFooter(`Thank you ${EmojiConstants.HEART}`);

        return embed;
    }

    public static GetDonationEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle('Donate')
            .setDescription(`Thank you for using ${SettingsConstants.BOT_NAME}!
A small donation would be much appreciated!
With your support I will be able to pay for the server costs and financially support other projects. 
You can donate using the methods below:

**Patreon** - [Link](${SettingsConstants.DONATION_PATREON_URL})

**Paypal** - [Link](${SettingsConstants.DONATION_PAYPAL_URL})

**Ko-fi** - [Link](${SettingsConstants.DONATION_KOFI_URL})

**Buy me a coffee** - [Link](${SettingsConstants.DONATION_BMAC_URL})

You can also help me by [voting for the bot](https://top.gg/bot/${SettingsConstants.BOT_ID}) and writing a review.`)
            .setFooter(`Thank you ${EmojiConstants.HEART}`);

        return embed;
    }

    public static GetDeveloperEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle('Developer')
            .setDescription(`${SettingsConstants.BOT_NAME} is developed by Sheepolution.

🌐 [Website](https://sheepolution.com)

🤖 [top.gg](https://top.gg/user/180335273500999680)

🐙 [Github](https://github.com/Sheepolution)

🐦 [Twitter](https://twitter.com)

🎮 [itch.io](https://sheepolution.itch.io)

📺 [Twitch](https://www.twitch.tv/sheepolution)

${EmojiConstants.HEART} [Donate](${SettingsConstants.DONATION_PAYPAL_URL})`)
            .setImage(ImageConstants.DEVELOPER.LOGO);

        return embed;
    }

    public static GetInviteEmbed() {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.GOOD)
            .setTitle('Invite')
            .setDescription(`Invite the bot to your own server - [Link](${SettingsConstants.BOT_INVITE_URL})

Go to the support server - [Link](${SettingsConstants.SUPPORT_SERVER_INVITE_URL})`);

        return embed;

    }
}
