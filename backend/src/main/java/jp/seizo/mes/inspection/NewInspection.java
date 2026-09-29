package jp.seizo.mes.inspection;

import java.math.BigDecimal;

public record NewInspection(String shijiNo, String lotNo, String kensaSha, BigDecimal sunpou, BigDecimal kijunMin,
		BigDecimal kijunMax, String hantei, String furyoNaiyo) {
}
