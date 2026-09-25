package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/** t_kensa 周りの SQL。旧画面の文字列連結は使わず、全て名前付きパラメータでバインドする。 */
@Repository
public class InspectionRepository {

    private static final RowMapper<InspectionRecord> RECORD_MAPPER = (rs, i) -> new InspectionRecord(
            rs.getLong("kensa_id"),
            rs.getString("shiji_no"),
            rs.getString("hinmoku_nm"),
            rs.getString("line_cd"),
            rs.getString("lot_no"),
            rs.getObject("kensa_ymd", LocalDate.class),
            rs.getString("kensa_sha"),
            rs.getBigDecimal("sunpou"),
            rs.getBigDecimal("kijun_min"),
            rs.getBigDecimal("kijun_max"),
            Hantei.fromLabel(rs.getString("hantei")),
            rs.getString("furyo_naiyo"));

    private final NamedParameterJdbcTemplate jdbc;

    public InspectionRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long insert(InspectionRequest req, LocalDate kensaYmd, Hantei hantei) {
        String sql = """
                insert into t_kensa
                  (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
                values
                  (:shiji_no, :lot_no, :kensa_ymd, :kensa_sha, :sunpou, :kijun_min, :kijun_max, :hantei, :furyo_naiyo)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("shiji_no", req.shijiNo())
                .addValue("lot_no", req.lotNo())
                .addValue("kensa_ymd", Date.valueOf(kensaYmd))
                .addValue("kensa_sha", req.kensaSha())
                .addValue("sunpou", scale3(req.sunpou()))
                .addValue("kijun_min", scale3(req.kijunMin()))
                .addValue("kijun_max", scale3(req.kijunMax()))
                .addValue("hantei", hantei.label())
                .addValue("furyo_naiyo", req.furyoNaiyo() == null ? "" : req.furyoNaiyo());
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(sql, params, keys, new String[] {"kensa_id"});
        return Objects.requireNonNull(keys.getKey(), "kensa_id not generated").longValue();
    }

    public List<InspectionRecord> findAll(String shijiNo, Hantei hantei) {
        StringBuilder sql = new StringBuilder("""
                select k.kensa_id, k.shiji_no, h.hinmoku_nm, s.line_cd, k.lot_no, k.kensa_ymd, k.kensa_sha,
                       k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo
                from t_kensa k
                join t_seizou_shiji s on k.shiji_no = s.shiji_no
                join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
                where 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (shijiNo != null && !shijiNo.isEmpty()) {
            sql.append(" and k.shiji_no = :shiji_no");
            params.addValue("shiji_no", shijiNo);
        }
        if (hantei != null) {
            sql.append(" and k.hantei = :hantei");
            params.addValue("hantei", hantei.label());
        }
        sql.append(" order by k.kensa_ymd desc, k.kensa_id desc");
        return jdbc.query(sql.toString(), params, RECORD_MAPPER);
    }

    public InspectionRecord findById(long kensaId) {
        String sql = """
                select k.kensa_id, k.shiji_no, h.hinmoku_nm, s.line_cd, k.lot_no, k.kensa_ymd, k.kensa_sha,
                       k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo
                from t_kensa k
                join t_seizou_shiji s on k.shiji_no = s.shiji_no
                join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
                where k.kensa_id = :kensa_id
                """;
        return jdbc.queryForObject(sql, new MapSqlParameterSource("kensa_id", kensaId), RECORD_MAPPER);
    }

    public List<DefectSummary> defectSummary() {
        String sql = """
                select furyo_naiyo, count(*) as ken from t_kensa
                where hantei <> 'OK' and furyo_naiyo <> ''
                group by furyo_naiyo order by ken desc
                """;
        return jdbc.query(sql, (rs, i) -> new DefectSummary(rs.getString("furyo_naiyo"), rs.getLong("ken")));
    }

    public List<OrderOption> orderOptions() {
        String sql = """
                select s.shiji_no, h.hinmoku_nm from t_seizou_shiji s
                join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
                order by s.shiji_no desc
                """;
        return jdbc.query(sql, (rs, i) -> new OrderOption(rs.getString("shiji_no"), rs.getString("hinmoku_nm")));
    }

    public boolean orderExists(String shijiNo) {
        Integer n = jdbc.queryForObject("select count(*) from t_seizou_shiji where shiji_no = :shiji_no",
                new MapSqlParameterSource("shiji_no", shijiNo), Integer.class);
        return n != null && n > 0;
    }

    private static BigDecimal scale3(BigDecimal v) {
        return v.setScale(3, RoundingMode.HALF_UP);
    }
}
