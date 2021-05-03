export default class SudokuUtils {
    public static GetFancyId(id: number) {
        return `#${id.toString().padStart(4, '0')}`;
    }
}