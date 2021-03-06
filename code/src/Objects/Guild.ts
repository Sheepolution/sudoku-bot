import SettingsConstants from '../Constants/SettingsConstants';
import { GuildState } from '../Enums/GuildState';
import BotManager from '../Managers/BotManager';
import GuildModel from '../Models/GuildModel';
import { Utils } from '../Utils/Utils';

export default class Guild {

    private model: GuildModel;
    private id: string;
    private discordId: string;
    private state: GuildState;
    private joinDate: Date;
    private leaveDate?: Date;
    private prefix: string;

    public ApplyModel(model: GuildModel) {
        this.model = model;
        this.id = model.id;
        this.discordId = model.discord_id;
        this.state = model.GetState();
        this.joinDate = Utils.GetDateOrNull(model.join_date);
        this.leaveDate = Utils.GetDateOrNull(model.end_date);
        this.prefix = model.prefix;
    }

    public GetId() {
        return this.id;
    }

    public GetDiscordId() {
        return this.discordId;
    }

    public GetPrefix() {
        return this.prefix ?? SettingsConstants.DEFAULT_PREFIX;
    }

    public SetPrefix(prefix: string) {
        if (this.prefix == prefix) {
            return;
        }

        this.prefix = prefix;
        this.model.Update({ prefix: this.prefix });
        BotManager.ClearPrefixCache(this.discordId);
    }

    public async OnJoin() {
        this.joinDate = Utils.GetNow();
        const joinDateString = Utils.GetDateAsString(this.joinDate);
        await this.model.Update({
            join_date: joinDateString,
            leave_date: null,
            state: GuildState.Joined,
        });
    }

    public async OnLeave() {
        this.leaveDate = Utils.GetNow();
        const leaveDateString = Utils.GetDateAsString(this.leaveDate);
        await this.model.Update({
            leave_date: leaveDateString,
            state: GuildState.Kicked,
            prefix: null,
        });

        BotManager.ClearPrefixCache(this.discordId);
    }
}