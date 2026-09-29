package jp.seizo.mes.inspection;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
public class InspectionRepository {

	private static final String INSERT_SQL = """
			insert into t_kensa (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
			values (:shijiNo, :lotNo, curdate(), :kensaSha, :sunpou, :kijunMin, :kijunMax, :hantei, :furyoNaiyo)
			""";

	private static final String LIST_SQL = """
			select k.kensa_id, k.shiji_no, h.hinmoku_nm, s.line_cd, k.lot_no, k.kensa_ymd, k.kensa_sha,
			       k.sunpou, k.kijun_min, k.kijun_max, k.hantei, k.furyo_naiyo
			from t_kensa k, t_seizou_shiji s, m_hinmoku h
			where k.shiji_no = s.shiji_no and s.hinmoku_cd = h.hinmoku_cd
			""";

	private static final String LIST_ORDER_BY = " order by k.kensa_ymd desc, k.kensa_id desc";

	private static final String DEFECT_SUMMARY_SQL = """
			select furyo_naiyo, count(*) as ken from t_kensa
			where hantei <> 'OK' and furyo_naiyo <> ''
			group by furyo_naiyo order by ken desc
			""";

	private static final String PRODUCTION_ORDERS_SQL = """
			select s.shiji_no, h.hinmoku_nm from t_seizou_shiji s, m_hinmoku h
			where s.hinmoku_cd = h.hinmoku_cd order by s.shiji_no desc
			""";

	private final NamedParameterJdbcTemplate jdbc;

	public InspectionRepository(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public long insert(NewInspection inspection) {
		MapSqlParameterSource params = new MapSqlParameterSource()
			.addValue("shijiNo", inspection.shijiNo())
			.addValue("lotNo", inspection.lotNo())
			.addValue("kensaSha", inspection.kensaSha())
			.addValue("sunpou", inspection.sunpou())
			.addValue("kijunMin", inspection.kijunMin())
			.addValue("kijunMax", inspection.kijunMax())
			.addValue("hantei", inspection.hantei())
			.addValue("furyoNaiyo", inspection.furyoNaiyo());
		KeyHolder keyHolder = new GeneratedKeyHolder();
		jdbc.update(INSERT_SQL, params, keyHolder, new String[] { "kensa_id" });
		return keyHolder.getKeyAs(Number.class).longValue();
	}

	public List<InspectionRecord> findAll(String shijiNo, String hantei) {
		StringBuilder sql = new StringBuilder(LIST_SQL);
		MapSqlParameterSource params = new MapSqlParameterSource();
		if (StringUtils.hasLength(shijiNo)) {
			sql.append(" and k.shiji_no = :shijiNo");
			params.addValue("shijiNo", shijiNo);
		}
		if (StringUtils.hasLength(hantei)) {
			sql.append(" and k.hantei = :hantei");
			params.addValue("hantei", hantei);
		}
		sql.append(LIST_ORDER_BY);
		return jdbc.query(sql.toString(), params, InspectionRepository::mapRecord);
	}

	public List<DefectSummary> summarizeDefects() {
		return jdbc.query(DEFECT_SUMMARY_SQL,
				(rs, rowNum) -> new DefectSummary(rs.getString("furyo_naiyo"), rs.getLong("ken")));
	}

	public List<ProductionOrderOption> findProductionOrders() {
		return jdbc.query(PRODUCTION_ORDERS_SQL,
				(rs, rowNum) -> new ProductionOrderOption(rs.getString("shiji_no"), rs.getString("hinmoku_nm")));
	}

	private static InspectionRecord mapRecord(ResultSet rs, int rowNum) throws SQLException {
		return new InspectionRecord(rs.getLong("kensa_id"), rs.getString("shiji_no"), rs.getString("hinmoku_nm"),
				rs.getString("line_cd"), rs.getString("lot_no"), rs.getObject("kensa_ymd", LocalDate.class),
				rs.getString("kensa_sha"), rs.getBigDecimal("sunpou"), rs.getBigDecimal("kijun_min"),
				rs.getBigDecimal("kijun_max"), rs.getString("hantei"), rs.getString("furyo_naiyo"));
	}

}
