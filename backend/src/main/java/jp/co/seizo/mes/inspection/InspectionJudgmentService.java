package jp.co.seizo.mes.inspection;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

/**
 * 品質検査の判定ロジック (app/inspection.cfm から切り出した唯一の判定実装)。
 *
 * <p>評価順序は現行 CFML と同一で、以下の順に評価する。
 * <ol>
 *   <li>判定の初期値は {@link #OK}。</li>
 *   <li>sunpou &lt; kijun_min または sunpou &gt; kijun_max のとき {@link #NG}。</li>
 *   <li>ここまで OK のままで、かつ (kijun_max - sunpou) &lt; 0.010 のとき {@link #SAIKENSA}。
 *       2011年3月の暫定運用 (上限ぎりぎりの製品を再検査に回す運用) が由来で、仕様書には記載がない。
 *       閾値 0.010 は厳密不等号 {@code <} であり、差がちょうど 0.010 の場合は OK のままとする。</li>
 * </ol>
 *
 * <p>比較は t_kensa の DECIMAL(8,3) 格納精度に合わせ、事前に scale=3 (HALF_UP) へ丸めてから行う。
 * DB へ格納される値と判定に使う値を一致させるため。
 *
 * <p>このクラスは DB / Web 層に一切依存しない純粋な判定関数として保つこと。
 */
@Service
public class InspectionJudgmentService {

	public static final String OK = "OK";
	public static final String NG = "NG";
	public static final String SAIKENSA = "再検査";

	/** 2011年暫定運用の再検査閾値 (mm)。厳密不等号 {@code <} で比較する。 */
	public static final BigDecimal SAIKENSA_THRESHOLD = new BigDecimal("0.010");

	/** t_kensa の DECIMAL(8,3) に合わせた格納精度。 */
	public static final int DB_SCALE = 3;

	public String judge(BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax) {
		BigDecimal measured = toDbScale(sunpou);
		BigDecimal min = toDbScale(kijunMin);
		BigDecimal max = toDbScale(kijunMax);

		String hantei = OK;
		if (measured.compareTo(min) < 0 || measured.compareTo(max) > 0) {
			hantei = NG;
		}
		if (OK.equals(hantei) && max.subtract(measured).compareTo(SAIKENSA_THRESHOLD) < 0) {
			hantei = SAIKENSA;
		}
		return hantei;
	}

	/** DECIMAL(8,3) 格納時と同じ丸め (HALF_UP, scale=3) を行う。 */
	public BigDecimal toDbScale(BigDecimal value) {
		return value.setScale(DB_SCALE, RoundingMode.HALF_UP);
	}
}
