import { MessageEmbed } from 'discord.js';
import CommandConstants from '../Constants/CommandConstants';
import EmojiConstants from '../Constants/EmojiConstants';
import ImageConstants from '../Constants/ImageConstants';
import SettingsConstants from '../Constants/SettingsConstants';
import Guild from '../Objects/Guild';
import CommandService from '../Services/CommandService';

export default class GeneralEmbeds {

    public static GetHelpEmbed(guild?: Guild) {
        const embed = new MessageEmbed()
            .setColor(SettingsConstants.COLORS.DEFAULT)
            .setTitle('Help')
            .setDescription(`${SettingsConstants.BOT_NAME} is a Discord bot for playing sudoku.

Use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PLAY[0])} to get a sudoku to solve.
You can use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.PLAY[0], ['vs @person'])} to challenge someone.

For information about the developer use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.DEVELOPER[0])}.
For information about donating use ${CommandService.GetCommandString(guild, CommandConstants.COMMANDS.DONATE[0])} ${EmojiConstants.HEART}.

If you have a question or want to report a problem, you can contact the developer in the [support server](${SettingsConstants.SUPPORT_SERVER_INVITE_URL}).
You can use [this](${SettingsConstants.BOT_INVITE_URL}) link to add the bot to your own server.
`);
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
