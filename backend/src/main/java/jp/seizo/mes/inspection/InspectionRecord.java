package jp.seizo.mes.inspection;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InspectionRecord(long kensaId, String shijiNo, String hinmokuNm, String lineCd, String lotNo,
		LocalDate kensaYmd, String kensaSha, BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax,
		String hantei, String furyoNaiyo) {
}
