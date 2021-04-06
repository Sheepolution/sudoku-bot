import { MessageReaction } from 'discord.js';
import EmojiConstants from '../Constants/EmojiConstants';
import PlayHandler from '../Handlers/PlayHandler';
import IMessageInfo from '../Interfaces/IMessageInfo';

export default class ReactionManager {

    public static OnReaction(messageInfo: IMessageInfo, reaction: MessageReaction) {
        switch (reaction.emoji.name) {
            case EmojiConstants.STATUS.GOOD:
                PlayHandler.OnAcceptChallenge(messageInfo);
                return;
        }
    }
}