package jp.co.seizo.mes.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** 検査登録の結果。現行画面の「検査結果を登録しました。判定は {hantei} です。」を表現できるようにする。 */
public class InspectionResponse {

	private final boolean ok;
	private final String message;
	private final String hantei;
	private final Integer kensaId;

	public InspectionResponse(boolean ok, String message, String hantei, Integer kensaId) {
		this.ok = ok;
		this.message = message;
		this.hantei = hantei;
		this.kensaId = kensaId;
	}

	public static InspectionResponse registered(String hantei, Integer kensaId) {
		return new InspectionResponse(true, "検査結果を登録しました。判定は " + hantei + " です。", hantei, kensaId);
	}

	public static InspectionResponse error(String message) {
		return new InspectionResponse(false, message, null, null);
	}

	public boolean isOk() {
		return ok;
	}

	public String getMessage() {
		return message;
	}

	public String getHantei() {
		return hantei;
	}

	@JsonProperty("kensa_id")
	public Integer getKensaId() {
		return kensaId;
	}
}
