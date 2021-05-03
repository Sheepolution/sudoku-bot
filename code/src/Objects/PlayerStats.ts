import { PlayType } from '../Enums/PlayType';
import PlayModel from '../Models/PlayModel';
import Play from './Play';

export default class PlayerStats {

    private model: PlayModel;
    private id: string;
    private solved: number;
    private fastestSolve: number;
    private fastestSolveSudokuId: number;
    private streak: number;
    private fastestAverageOfFive: number;
    private currentAverageOfFive: number;
    private newFastestSolve: boolean;
    private newFastestAverageOfFive: boolean;

    public ApplyModel(model: PlayModel) {
        this.model = model;
        this.id = model.id;
        this.solved = model.solved;
        this.fastestSolve = model.fastest_solve;
        this.fastestSolveSudokuId = model.fastestSolve;
        this.streak = model.streak;
        this.fastestAverageOfFive = model.fastest_avg_of_five;
        this.newFastestSolve = false;
        this.newFastestAverageOfFive = false;
    }

    public GetId() {
        return this.id;
    }

    public GetSolved() {
        return this.solved;
    }

    public GetFastestSolve() {
        return this.fastestSolve;
    }

    public GetFastestSolveSudokuId() {
        return this.fastestSolveSudokuId;
    }

    public GetStreak() {
        return this.streak;
    }

    public async ResetStreak() {
        if (this.streak == 0) {
            return;
        }

        this.streak = 0;

        await this.model.Update({
            streak: 0,
        });
    }

    public GetFastestAverageOfFive() {
        return this.fastestAverageOfFive;
    }

    public async GetCurrentAverageOfFive() {
        if (this.streak >= 5) {
            const averageOfFive = await PlayModel.GetAverageOfLastFive(this.model.player_id);
            this.currentAverageOfFive = averageOfFive;
        } else {
            this.currentAverageOfFive = null;
        }

        return this.currentAverageOfFive;
    }

    public async OnSolve(play: Play) {
        this.newFastestSolve = false;
        this.newFastestAverageOfFive = false;

        const updateObject: any = {};
        this.solved += 1;
        updateObject.solved = this.solved;

        if (play.GetType() == PlayType.Single) {
            this.streak += 1;
            updateObject.streak = this.streak;

            if (this.streak >= 5) {
                const averageOfFive = await PlayModel.GetAverageOfLastFive(this.model.player_id);
                this.currentAverageOfFive = averageOfFive;

                if (this.fastestAverageOfFive == null || this.currentAverageOfFive < this.fastestAverageOfFive) {
                    this.fastestAverageOfFive = this.currentAverageOfFive;
                    updateObject.fastest_avg_of_five = this.fastestAverageOfFive;
                    this.newFastestAverageOfFive = true;
                }
            } else {
                this.currentAverageOfFive = null;
            }
        }

        const playDuration = play.GetDuration();
        if (this.solved == 1 || playDuration < this.fastestSolve) {
            this.fastestSolve = playDuration;
            this.fastestSolveSudokuId = play.GetSudokuId();
            updateObject.fastest_solve = this.fastestSolve;
            updateObject.fastest_solve_sudoku_id = this.fastestSolveSudokuId;
            this.newFastestSolve = true;
        }

        await this.model.Update(updateObject);
    }

    public IsNewFastestSolve() {
        return this.newFastestSolve;
    }

    public IsNewFastestAverageOfFive() {
        return this.newFastestAverageOfFive;
    }
}