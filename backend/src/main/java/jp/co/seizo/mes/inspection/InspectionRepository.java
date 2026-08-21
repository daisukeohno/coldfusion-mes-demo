package jp.co.seizo.mes.inspection;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import jp.co.seizo.mes.inspection.dto.DefectSummary;
import jp.co.seizo.mes.inspection.dto.InspectionRecord;
import jp.co.seizo.mes.inspection.dto.OrderOption;

/**
 * t_kensa / t_seizou_shiji / m_hinmoku へのアクセス。
 * 現行 CFML は絞込条件を文字列連結していたが、ここでは全てパラメータバインドする。
 */
@Repository
public class InspectionRepository {

	private static final RowMapper<InspectionRecord> RECORD_MAPPER = (rs, rowNum) -> new InspectionRecord(
			rs.getInt("kensa_id"),
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

	private final JdbcTemplate jdbcTemplate;

	public InspectionRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	/** 検査履歴一覧。shiji_no / hantei で任意絞込、kensa_ymd desc, kensa_id desc 順。 */
	public List<InspectionRecord> findInspections(String shijiNo, String hantei) {
		StringBuilder sql = new StringBuilder("""
				select k.kensa_id, k.shiji_no, h.hinmoku_nm, s.line_cd, k.lot_no, k.kensa_ymd,
				       k.kensa_sha, k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo
				  from t_kensa k, t_seizou_shiji s, m_hinmoku h
				 where k.shiji_no = s.shiji_no and s.hinmoku_cd = h.hinmoku_cd
				""");
		List<Object> params = new ArrayList<>();
		if (StringUtils.hasLength(shijiNo)) {
			sql.append(" and k.shiji_no = ?");
			params.add(shijiNo);
		}
		if (StringUtils.hasLength(hantei)) {
			sql.append(" and k.hantei = ?");
			params.add(hantei);
		}
		sql.append(" order by k.kensa_ymd desc, k.kensa_id desc");
		return jdbcTemplate.query(sql.toString(), RECORD_MAPPER, params.toArray());
	}

	/** 不良内容集計。hantei <> 'OK' かつ furyo_naiyo <> '' の行を件数降順で返す。 */
	public List<DefectSummary> findDefectSummary() {
		return jdbcTemplate.query("""
				select furyo_naiyo, count(*) as ken
				  from t_kensa
				 where hantei <> 'OK' and furyo_naiyo <> ''
				 group by furyo_naiyo
				 order by ken desc
				""", (rs, rowNum) -> new DefectSummary(rs.getString("furyo_naiyo"), rs.getLong("ken")));
	}

	/** 製造指示ドロップダウン用一覧 (shiji_no desc)。 */
	public List<OrderOption> findOrdersForInspection() {
		return jdbcTemplate.query("""
				select s.shiji_no, h.hinmoku_nm
				  from t_seizou_shiji s, m_hinmoku h
				 where s.hinmoku_cd = h.hinmoku_cd
				 order by s.shiji_no desc
				""", (rs, rowNum) -> new OrderOption(rs.getString("shiji_no"), rs.getString("hinmoku_nm")));
	}

	/** t_kensa へ INSERT する。kensa_ymd はサーバ現在日付 (curdate())。 */
	public int insert(String shijiNo, String lotNo, String kensaSha, BigDecimal sunpou,
			BigDecimal kijunMin, BigDecimal kijunMax, String hantei, String furyoNaiyo) {
		String sql = """
				insert into t_kensa (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
				values (?, ?, curdate(), ?, ?, ?, ?, ?, ?)
				""";
		KeyHolder keyHolder = new GeneratedKeyHolder();
		jdbcTemplate.update(connection -> {
			PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
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
		return key == null ? 0 : key.intValue();
	}
}
