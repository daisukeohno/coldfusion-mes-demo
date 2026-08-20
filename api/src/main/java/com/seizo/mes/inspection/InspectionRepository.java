package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/**
 * t_kensa / t_seizou_shiji / m_hinmoku へのアクセス。スキーマは CFML 版と共有するため変更しない。
 * 現行の文字列連結 SQL (preserveSingleQuotes) は使わず、必ずパラメータバインドする。
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

    private static final RowMapper<KensaResult> KENSA_MAPPER = InspectionRepository::mapKensa;

    private final JdbcTemplate jdbcTemplate;

    public InspectionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 検査結果を登録し採番された kensa_id を返す。kensa_ymd は現行 (curdate()) と同じく当日。 */
    public long insert(
            String shijiNo,
            String lotNo,
            LocalDate kensaYmd,
            String kensaSha,
            BigDecimal sunpou,
            BigDecimal kijunMin,
            BigDecimal kijunMax,
            Hantei hantei,
            String furyoNaiyo) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement("""
                    insert into t_kensa
                        (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, new String[] {"kensa_id"});
            ps.setString(1, shijiNo);
            ps.setString(2, lotNo);
            ps.setObject(3, kensaYmd);
            ps.setString(4, kensaSha);
            ps.setBigDecimal(5, sunpou);
            ps.setBigDecimal(6, kijunMin);
            ps.setBigDecimal(7, kijunMax);
            ps.setString(8, hantei.value());
            ps.setString(9, furyoNaiyo);
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

    /** 検査履歴。結合条件と並び順は現行 qKensa と同一。絞込はパラメータバインドで行う。 */
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

    /** 不良内容集計 (現行 qFuryo 相当)。OK 以外かつ不良内容が入力された行を件数降順で返す。 */
    public List<DefectSummary> defectSummary() {
        return jdbcTemplate.query("""
                select furyo_naiyo, count(*) as ken
                  from t_kensa
                 where hantei <> 'OK' and furyo_naiyo <> ''
                 group by furyo_naiyo
                 order by ken desc
                """, (rs, rowNum) -> new DefectSummary(rs.getString("furyo_naiyo"), rs.getLong("ken")));
    }

    /** 製造指示プルダウン用一覧 (現行 qShijiList 相当)。 */
    public List<OrderForInspection> findOrdersForInspection() {
        return jdbcTemplate.query("""
                select s.shiji_no, h.hinmoku_nm
                  from t_seizou_shiji s
                  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
                 order by s.shiji_no desc
                """, (rs, rowNum) ->
                new OrderForInspection(rs.getString("shiji_no"), rs.getString("hinmoku_nm")));
    }

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
}
