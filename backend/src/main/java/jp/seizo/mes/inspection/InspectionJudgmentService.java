package jp.seizo.mes.inspection;

import java.math.BigDecimal;
import java.util.Objects;

import org.springframework.stereotype.Service;

/**
 * 品質検査の判定ルール (旧 app/inspection.cfm から移植)。DB に依存しない純粋なロジック。
 *
 * <ol>
 * <li>初期値は "OK"</li>
 * <li>sunpou &lt; kijunMin または sunpou &gt; kijunMax なら "NG"</li>
 * <li>"OK" のまま、かつ (kijunMax - sunpou) &lt; 0.010 なら "再検査" (上限側のみ。下限側は再検査にしない)</li>
 * </ol>
 */
@Service
public class InspectionJudgmentService {

	public static final String OK = "OK";
	public static final String NG = "NG";
	public static final String RE_INSPECTION = "再検査";

	static final BigDecimal RE_INSPECTION_MARGIN = new BigDecimal("0.010");

	public String judge(BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax) {
		Objects.requireNonNull(sunpou, "sunpou");
		Objects.requireNonNull(kijunMin, "kijunMin");
		Objects.requireNonNull(kijunMax, "kijunMax");

		String hantei = OK;
		if (sunpou.compareTo(kijunMin) < 0 || sunpou.compareTo(kijunMax) > 0) {
			hantei = NG;
		}
		if (OK.equals(hantei) && kijunMax.subtract(sunpou).compareTo(RE_INSPECTION_MARGIN) < 0) {
			hantei = RE_INSPECTION;
		}
		return hantei;
	}

}
