import { Utils } from '../Utils/Utils';
import Sudoku from '../Objects/Sudoku';
import { PlayType } from '../Enums/PlayType';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import { PlayState } from '../Enums/PlayState';

const { Model } = require('objection');

export default class PlayModel extends Model {

    static get tableName() {
        return 'play';
    }

    public static async New(sudoku: Sudoku, guild: Guild, creator: Player, startDate: Date, type: PlayType, messageId: string, opponent?: Player) {
        const playId = Utils.UUID();

        const play = await PlayModel.query()
            .insert({
                id: playId,
                sudoku_id: sudoku.GetId(),
                guild_id: guild.GetId(),
                creator_id: creator.GetId(),
                opponent_id: opponent?.GetId(),
                state: PlayState.Started,
                start_date: Utils.GetDateAsString(startDate),
                type: type,
                message_id: messageId,
            });

        return play;
    }

    public static async GetById(id: string) {
        return await PlayModel.query().findById(id);
    }

    public static async GetSudokuGuildRank(playId: string, sudokuId: number, guildId: string) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select toplist.rank_number from
                (select id, rank () over ( order by duration ) rank_number from play
                    where state = ? 
                    and sudoku_id = ?
                    and guild_id = ?
                ) as toplist
            where toplist.id = ? limit 1;
        `, [PlayState.Solved, sudokuId, guildId, playId])).rows[0].rank_number;
    }

    public static async GetSudokuGlobalRank(playId: string, sudokuId: number) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select toplist.rank_number from
                (select id, rank () over ( order by duration ) rank_number from play
                    where state = ? 
                    and sudoku_id = ?
                ) as toplist
            where toplist.id = ? limit 1;
        `, [PlayState.Solved, sudokuId, playId])).rows[0].rank_number;
    }

    public static async GetAverageOfLastFive(playerId: string) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select avg(lastFiveSolves.duration) from
                (select solve_date, duration from play
                    where state = ?
                    and solver_id = ?
                    and type = ?
                    order by solve_date desc limit 5
                ) as lastFiveSolves;
        `, [PlayState.Solved, playerId, PlayType.Single])).rows[0].avg;
    }

    public static async DeleteById(id: string) {
        return await PlayModel.query().findById(id).delete();
    }

    public async Update(data: any, trx?: any) {
        await PlayModel.query(trx)
            .findById(this.id)
            .patch(data);
    }

    public GetType() {
        switch (this.type) {
            case '00': return PlayType.Single;
            case '01': return PlayType.VS;
            case '10': return PlayType.Royale;
            default: return PlayType.Single;
        }
    }
}