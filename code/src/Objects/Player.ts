import { PlayerState } from '../Enums/PlayerState';
import PlayerModel from '../Models/PlayerModel';
import PlayerStatsRepository from '../Repositories/PlayerStatsRepository';

export default class Player {

    private model: PlayerModel;
    private id: string;
    private discordId: string;
    private state: PlayerState;
    private joinDate: Date;
    private leaveDate?: Date;
    private name: string;
    private customName: boolean;

    public ApplyModel(model: PlayerModel) {
        this.model = model;
        this.id = model.id;
        this.discordId = model.discord_id;
        this.joinDate = model.join_date;
        this.leaveDate = model.leave_date;
        this.name = model.name;
        this.customName = model.custom_name;
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

    public async SetName(name: string, custom: boolean) {
        if (this.name == name) {
            return;
        }

        const updateObject: any = { name: this.name };

        if (custom != null) {
            updateObject.custom = custom;
        }

        await this.model.Update(updateObject);
    }

    public async GetStats() {
        return await PlayerStatsRepository.GetByPlayerId(this.id);
    }
}