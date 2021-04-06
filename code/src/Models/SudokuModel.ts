const { Model } = require('objection');

export default class SudokuModel extends Model {

    static get tableName() {
        return 'sudoku';
    }

    public static async GetById(id: number) {
        const model: SudokuModel = await SudokuModel.query().findById(id);
        return model;
    }
}