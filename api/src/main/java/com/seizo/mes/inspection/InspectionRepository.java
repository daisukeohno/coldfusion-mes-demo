package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/**
 * t_kensa へのアクセス。現行の文字列連結 SQL は使わず、必ずパラメータバインドする。
 */
@Repository
public class InspectionRepository {

    private static final String SELECT_KENSA = """
            select k.kensa_id, k.shiji_no, h.hinmoku_nm, s.line_cd, k.lot_no, k.kensa_ymd
                 , k.kensa_sha, k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo
              from t_kensa k
              join t_seizou_shiji s on k.shiji_no = s.shiji_no
              join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
            """;

    private final JdbcTemplate jdbcTemplate;

    public InspectionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<KensaResult> KENSA_MAPPER = InspectionRepository::mapKensa;

    private static KensaResult mapKensa(ResultSet rs, int rowNum) throws SQLException {
        return new KensaResult(
                rs.getLong("kensa_id"),
                rs.getString("shiji_no"),
                rs.getString("hinmoku_nm"),
                rs.getString("line_cd"),
                rs.getString("lot_no"),
                rs.getDate("kensa_ymd") == null ? null : rs.getDate("kensa_ymd").toLocalDate(),
                rs.getString("kensa_sha"),
                rs.getBigDecimal("sunpou"),
                rs.getBigDecimal("kijun_min"),
                rs.getBigDecimal("kijun_max"),
                rs.getString("hantei"),
                rs.getString("furyo_naiyo"));
    }

    /** 検査結果を登録し、採番された kensa_id を返す。kensa_ymd は現行同様に当日 (curdate())。 */
    public long insert(
            String shijiNo,
            String lotNo,
            String kensaSha,
            BigDecimal sunpou,
            BigDecimal kijunMin,
            BigDecimal kijunMax,
            String hantei,
            String furyoNaiyo) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement("""
                    insert into t_kensa
                        (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
                    values (?, ?, curdate(), ?, ?, ?, ?, ?, ?)
                    """, new String[] {"kensa_id"});
            ps.setString(1, shijiNo);
            ps.setString(2, lotNo);
            ps.setString(3, kensaSha);
            ps.setBigDecimal(4, sunpou);
            ps.setBigDecimal(5, kijunMin);
            ps.setBigDecimal(6, kijunMax);
            ps.setString(7, hantei);
            ps.setString(8, furyoNaiyo);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        return key == null ? 0L : key.longValue();
    }

    public KensaResult findById(long kensaId) {
        List<KensaResult> rows =
                jdbcTemplate.query(SELECT_KENSA + " where k.kensa_id = ?", KENSA_MAPPER, kensaId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** 指示番号 / 判定で絞り込んだ検査履歴。並び順は現行画面と同じ。 */
    public List<KensaResult> search(String shijiNo, String hantei) {
        StringBuilder sql = new StringBuilder(SELECT_KENSA).append(" where 1 = 1");
        List<Object> args = new ArrayList<>();
        if (shijiNo != null && !shijiNo.isEmpty()) {
            sql.append(" and k.shiji_no = ?");
            args.add(shijiNo);
        }
        if (hantei != null && !hantei.isEmpty()) {
            sql.append(" and k.hantei = ?");
            args.add(hantei);
        }
        sql.append(" order by k.kensa_ymd desc, k.kensa_id desc");
        return jdbcTemplate.query(sql.toString(), KENSA_MAPPER, args.toArray());
    }

    /** 不良内容の集計。OK 以外かつ不良内容が入力されている行のみ、件数降順。 */
    public List<DefectSummary> defectSummary() {
        return jdbcTemplate.query("""
                select furyo_naiyo, count(*) as ken
                  from t_kensa
                 where hantei <> 'OK' and furyo_naiyo <> ''
                 group by furyo_naiyo
                 order by ken desc
                """, (rs, rowNum) -> new DefectSummary(rs.getString("furyo_naiyo"), rs.getLong("ken")));
    }

    /** 製造指示プルダウン用の一覧。 */
    public List<SimpleOrder> findSimpleOrders() {
        return jdbcTemplate.query("""
                select s.shiji_no, h.hinmoku_nm
                  from t_seizou_shiji s
                  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
                 order by s.shiji_no desc
                """, (rs, rowNum) -> new SimpleOrder(rs.getString("shiji_no"), rs.getString("hinmoku_nm")));
    }
}
