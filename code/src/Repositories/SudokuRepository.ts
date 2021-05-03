import SettingsConstants from '../Constants/SettingsConstants';
import SudokuConstants from '../Constants/SudokuConstants';
import CacheManager from '../Managers/CacheManager';
import SudokuModel from '../Models/SudokuModel';
import Sudoku from '../Objects/Sudoku';
import { Utils } from '../Utils/Utils';

export default class SudokuRepository {

    public static Make(model: SudokuModel) {
        const sudoku = new Sudoku();
        sudoku.ApplyModel(model);
        return sudoku;
    }

    public static async GetById(id: number) {
        return await CacheManager.Get(SudokuRepository, SudokuModel.GetById, [id], SettingsConstants.CACHE_TIMEOUT_DEFAULT);
    }

    public static async GetRandom() {
        return this.GetById(Utils.Random(0, SudokuConstants.NUMBER_OF_SUDOKUS - 1, true));
    }
}