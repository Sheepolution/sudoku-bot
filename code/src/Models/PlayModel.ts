import { Utils } from '../Utils/Utils';
import Sudoku from '../Objects/Sudoku';
import { PlayType } from '../Enums/PlayType';
import Guild from '../Objects/Guild';
import Player from '../Objects/Player';
import { PlayState } from '../Enums/PlayState';
import { PlayerState } from '../Enums/PlayerState';

const { Model } = require('objection');

export default class PlayModel extends Model {

    static get tableName() {
        return 'play';
    }

    public static async New(sudoku: Sudoku, guild: Guild, creator: Player, startDate: Date, type: PlayType, messageId: string, channelId: string, opponent?: Player) {
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
                channel_id: channelId,
            });

        return play;
    }

    public static async GetById(id: string) {
        return await PlayModel.query().findById(id);
    }

    public static async GetUnfinishedPlayByPlayerId(playerId: string) {
        const play = await PlayModel.query()
            .where((builder: any) => {
                builder.where('creator_id', playerId).orWhere('opponent_id', playerId);
            })
            .andWhere({ state: PlayState.Started })
            .first();

        return play;
    }

    public static async GetUnfinishedRoyalePlayByChannelId(guildId: string, channelId: string) {
        const play = await PlayModel.query()
            .where({ guild_id: guildId, channel_id: channelId, state: PlayState.Started })
            .first();

        return play;
    }

    public static async GetPersonalPlayRank(playId: string, playerId: string) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select total.total, toplist.rank from
                (select id, rank () over ( order by duration ) rank from play
                    where state = ? 
                    and solver_id = ?
                ) as toplist,
                (select count(id) as total from play
                    where state = ? 
                    and solver_id = ?
                ) as total
            where toplist.id = ?
            limit 1;
        `, [PlayState.Solved, playerId, PlayState.Solved, playerId, playId])).rows[0];
    }

    public static async GetSudokuGuildRank(playerId: string, sudokuId: number, guildId: string) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select total.total, toplist.rank from
                (select solver_id, rank () over ( order by duration ) rank from play
                    where state = ? 
                    and sudoku_id = ?
                    and guild_id = ?
                ) as toplist,
                (select count(id) as total from play
                    where state = ? 
                    and sudoku_id = ?
                    and guild_id = ?
                ) as total
            where toplist.solver_id = ?
            limit 1;
        `, [PlayState.Solved, sudokuId, guildId, PlayState.Solved, sudokuId, guildId, playerId])).rows[0];
    }

    public static async GetSudokuGlobalRank(playerId: string, sudokuId: number) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select total.total, toplist.rank, toplist.duration from
                (select solver_id, duration, rank () over ( order by duration ) rank from play
                    where state = ? 
                    and sudoku_id = ?
                ) as toplist,
                (select count(id) as total from play
                    where state = ? 
                    and sudoku_id = ?
                ) as total
            where toplist.solver_id = ?
            limit 1;
        `, [PlayState.Solved, sudokuId, PlayState.Solved, sudokuId, playerId])).rows[0];
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

    public static async GetTopFastestSpecificSudokuSolves(sudokuId: number, guildId?: string) {
        var bindings: Array<any> = [PlayState.Solved, sudokuId, PlayerState.Active];

        if (guildId != null) {
            bindings.push(guildId);
        }

        const knex = PlayModel.knex();
        return (await knex.raw(`
            select distinct on (list.name) list.name, duration from 
            (select name, sudoku_id, duration from play
                join player on player.id = play.solver_id
                where play.state = ?
                and sudoku_id = ?
                and player.state = ?
                ${guildId == null ? '' : 'and guild_id = ?'}
                order by duration
            ) as list
            fetch first 10 rows only;
        `, bindings)).rows;
    }

    public static async GetPersonalFastestSolvesList(playerId: string) {
        const knex = PlayModel.knex();
        return (await knex.raw(`
            select sudoku_id, duration from play
            where play.state = ?
            and play.solver_id = ?
            order by duration
            fetch first 10 rows only;
        `, [PlayState.Solved, playerId])).rows;
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