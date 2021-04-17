import { PlayState } from '../Enums/PlayState';
import { PlayType } from '../Enums/PlayType';
import PlayModel from '../Models/PlayModel';
import PlayerRepository from '../Repositories/PlayerRepository';
import SudokuRepository from '../Repositories/SudokuRepository';
import { Utils } from '../Utils/Utils';
import Player from './Player';

export default class Play {

    private model: PlayModel;
    private id: string;
    private startDate: Date;
    private solveDate?: Date;
    private state: PlayState;
    private duration: number;
    private type: PlayType;
    private messageId: string;

    public ApplyModel(model: PlayModel) {
        this.model = model;
        this.id = model.id;
        this.startDate = Utils.GetDateOrNull(model.start_date);
        this.solveDate = Utils.GetDateOrNull(model.solve_date);
        this.duration = model.duration;
        this.type = model.GetType();
        this.messageId = model.message_id;
    }

    public GetId() {
        return this.id;
    }

    public IsSolved() {
        return this.state = PlayState.Solved;
    }

    public GetStartDate() {
        return this.startDate;
    }

    public GetSolveDate() {
        return this.solveDate;
    }

    public GetDuration() {
        return this.duration;
    }

    public GetType() {
        return this.type;
    }

    public async GetSudoku() {
        return await SudokuRepository.GetById(this.model.sudoku_id);
    }

    public GetSudokuId() {
        return this.model.sudoku_id;
    }

    public GetMessageId() {
        return this.messageId;
    }

    public async GetOpponent(player: Player) {
        if (player.GetId() == this.model.creator_id) {
            return await PlayerRepository.GetById(this.model.opponent_id);
        } else {
            return await PlayerRepository.GetById(this.model.creator_id);
        }
    }

    public async OnSolve(solver: Player, solveDate: Date) {

        const duration = Utils.GetDateDifferenceInSeconds(this.startDate, solveDate);

        this.duration = duration;
        this.solveDate = solveDate;
        this.state = PlayState.Solved;

        await this.model.Update({
            solver_id: solver.GetId(),
            solve_date: Utils.GetDateAsString(solveDate),
            state: PlayState.Solved,
            duration: duration,
        });
    }
}