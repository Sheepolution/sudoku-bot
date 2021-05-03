import SettingsConstants from '../Constants/SettingsConstants';
import { PlayerState } from '../Enums/PlayerState';
import PlayerModel from '../Models/PlayerModel';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';
import { Utils } from '../Utils/Utils';

export default class Player {

    private model: PlayerModel;
    private id: string;
    private discordId: string;
    private state: PlayerState;
    private joinDate: Date;
    private leaveDate?: Date;
    private name: string;
    private customName: boolean;
    private strikes: number;
    private preparingPlay: boolean;

    public ApplyModel(model: PlayerModel) {
        this.model = model;
        this.id = model.id;
        this.discordId = model.discord_id;
        this.joinDate = Utils.GetDateOrNull(model.join_date);
        this.leaveDate = Utils.GetDateOrNull(model.leave_date);
        this.name = model.name;
        this.customName = model.custom_name;
        this.strikes = model.strikes || 0;
        this.preparingPlay = false;
    }

    public GetId() {
        return this.id;
    }

    public GetDiscordId() {
        return this.discordId;
    }

    public GetJoinDate() {
        return this.joinDate;
    }

    public GetLeaveDate() {
        return this.leaveDate;
    }

    public GetName() {
        return this.name;
    }

    public IsBanned() {
        return this.state == PlayerState.Banned;
    }

    public async SetName(name: string, custom: boolean) {
        if (this.name == name) {
            return;
        }

        if (!custom && this.customName) {
            return;
        }

        const updateObject: any = { name: this.name };

        if (custom != null) {
            updateObject.custom = custom;
        }

        await this.model.Update(updateObject);
    }

    public IsPreparingPlay() {
        return this.preparingPlay;
    }

    public SetPreparingPlay(preparingPlay: boolean) {
        this.preparingPlay = preparingPlay;
    }

    public async GetStats() {
        return await PlayerStatsRepository.GetByPlayerId(this.id);
    }

    public async OnCheating() {
        this.strikes += 1;

        if (this.strikes > SettingsConstants.MAX_ALLOWED_STRIKES) {
            this.state = PlayerState.Banned;
        }

        await this.model.Update({
            state: this.state,
            strikes: this.strikes,
        });
    }
}