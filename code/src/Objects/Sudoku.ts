import SettingsConstants from '../Constants/SettingsConstants';
import SudokuModel from '../Models/SudokuModel';
import SudokuUtils from '../Utils/SudokuUtils';

export default class Sudoku {

    private model: SudokuModel;
    private id: number;
    private puzzle: string;
    private solution: string;
    private prettyPuzzle: string;
    private prettySolution: string;

    public ApplyModel(model: SudokuModel) {
        this.model = model;
        this.id = model.id;
        this.puzzle = model.puzzle;
        this.solution = model.solution;
        this.MakePretty();
    }

    public GetId() {
        return this.id;
    }

    public GetFancyId() {
        return SudokuUtils.GetFancyId(this.id);
    }

    public GetPuzzle() {
        return this.prettyPuzzle;
    }

    public GetSolution() {
        return this.prettySolution;
    }

    public CheckSolution(givenSolution: string) {
        const givenSolutionNumbers = givenSolution.replace(/[^\d]/g, '');
        const solutionNumbers = this.solution.replace(/[^\d]/g, '');
        return solutionNumbers == givenSolutionNumbers;
    }

    private MakePretty() {
        const puzzle = this.puzzle.split('');
        const solution = this.solution.split('');

        var puzzleString = '`​```         SUDOKU\n+-------+-------+-------+\n|';
        var solutionString = puzzleString;

        for (let i = 0; i < puzzle.length; i++) {
            const n = puzzle[i] == '0' ? '.' : puzzle[i];
            const ns = solution[i];

            if (i > 0 && i % 27 == 0) {
                puzzleString += ' |\n+-------+-------+-------+\n| ';
                solutionString += ' |\n+-------+-------+-------+\n| ';
            } else if (i > 0 && i % 9 == 0) {
                puzzleString += ' |\n| ';
                solutionString += ' |\n| ';
            } else if (i > 0 && i % 3 == 0) {
                puzzleString += ' | ';
                solutionString += ' | ';
            } else {
                puzzleString += ' ';
                solutionString += ' ';
            }

            puzzleString += n;
            solutionString += ns;
        }

        puzzleString += ' |\n+-------+-------+-------+\n```​' + `<@${SettingsConstants.BOT_ID}>` + '`';
        solutionString += ' |\n+-------+-------+-------+\n```​';

        this.prettyPuzzle = puzzleString;
        this.prettySolution = solutionString;
    }
}