import { Utils } from '../Utils/Utils';
import { PlayType } from '../Enums/PlayType';
import Player from '../Objects/Player';
import { PlayerState } from '../Enums/PlayerState';

const { Model } = require('objection');

export default class PlayerStatsModel extends Model {

    static get tableName() {
        return 'playerstats';
    }

    public static async New(player: Player) {
        const playerStatsId = Utils.UUID();

        const play = await PlayerStatsModel.query()
            .insert({
                id: playerStatsId,
                player_id: player.GetId(),
                solved: 0,
                streak: 0,
            });

        return play;
    }

    public static async GetByPlayerId(playerId: string) {
        return await PlayerStatsModel.query().where('player_id', playerId);
    }

    public static async GetFastestSolveGuildRank(playerId: string, guildId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select toplist.rank_number from
                (select playerstats.player_id as playerId, rank () over ( order by fastest_solve ) rank_number from playerstats
                    join
                        player_guild on player_guild.player_id = playerstats.player_id
                    where
                        player_guild.guild_id = ?
                        and fastest_solve is not null
                ) as toplist
            where toplist.playerId = ? limit 1;
            `, [guildId, playerId])).rows[0].rank_number;
    }

    public static async GetFastestSolveGlobalRank(playerId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select toplist.rank_number from
                (select player_id, rank () over ( order by fastest_solve ) rank_number from playerstats
                    where fastest_solve is not null
                ) as toplist
            where toplist.player_id = ? limit 1;
        `, [playerId])).rows[0].rank_number;
    }

    public static async GetFastestAverageOfFiveGuildRank(playerId: string, guildId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select toplist.rank_number from
                (select playerstats.player_id as playerId, rank () over ( order by fastest_avg_of_five ) rank_number from playerstats
                    join
                        player_guild on player_guild.player_id = playerstats.player_id
                    where
                        player_guild.guild_id = ?
                        and fastest_avg_of_five is not null
                ) as toplist
            where toplist.playerId = ? limit 1;
        `, [guildId, playerId])).rows[0].rank_number;
    }

    public static async GetFastestAverageOfFiveGlobalRank(playerId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select toplist.rank_number from
                (select player_id, rank () over ( order by fastest_avg_of_five ) rank_number from playerstats
                    where fastest_avg_of_five is not null
                ) as toplist
            where toplist.player_id = ? limit 1;
        `, [playerId])).rows[0].rank_number;
    }

    // Lists

    public static async GetFastestSolveGuildList(guildId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select player.name, playerstats.fastest_solve as duration, fastest_solve_sudoku_id as sudoku_id from playerstats
            join
                player_guild on player_guild.player_id = playerstats.player_id
            join
                player on player.id = playerstats.player_id
            where
                player_guild.guild_id = ?
                and player.state = ?
                and fastest_solve is not null
            order by duration
            fetch first 10 rows only
            `, [guildId, PlayerState.Active])).rows;
    }

    public static async GetFastestSolveGlobalList() {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select player.name, playerstats.fastest_solve as duration, fastest_solve_sudoku_id as sudoku_id from playerstats
            join
                player on player.id = playerstats.player_id
            where
                fastest_solve is not null
                and player.state = ?
            order by duration
            fetch first 10 rows only
            `, [PlayerState.Active])).rows;
    }

    public static async GetFastestAverageOfFiveGuildList(guildId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select player.name, playerstats.fastest_avg_of_five as duration from playerstats
            join
                player_guild on player_guild.player_id = playerstats.player_id
            join
                player on player.id = playerstats.player_id
            where
                player_guild.guild_id = ?
                and player.state = ?
                and fastest_avg_of_five is not null
            order by duration
            fetch first 10 rows only
            `, [guildId, PlayerState.Active])).rows;
    }

    public static async GetFastestAverageOfFiveGlobalList() {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select player.name, playerstats.fastest_avg_of_five as duration from playerstats
            join
                player on player.id = playerstats.player_id
            where
                fastest_avg_of_five is not null
                and player.state = ?
            order by duration
            fetch first 10 rows only
            `, [PlayerState.Active])).rows;
    }

    public static async GetMostSolvedGuildList(guildId: string) {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select player.name, playerstats.fastest_avg_of_five as duration from playerstats
            join
                player_guild on player_guild.player_id = playerstats.player_id
            join
                player on player.id = playerstats.player_id
            where
                player_guild.guild_id = ?
                and player.state = ?
                and solved > 0
            order by solved desc
            fetch first 10 rows only
            `, [guildId, PlayerState.Active])).rows;
    }

    public static async GetMostSolvedGlobalList() {
        const knex = PlayerStatsModel.knex();
        return (await knex.raw(`
            select player.name, playerstats.solved as solved from playerstats
            join
                player on player.id = playerstats.player_id
            where
                solved > 0
                and player.state = ?
            order by solved desc
            fetch first 10 rows only
            `, [PlayerState.Active])).rows;
    }

    public async Update(data: any, trx?: any) {
        await PlayerStatsModel.query(trx)
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