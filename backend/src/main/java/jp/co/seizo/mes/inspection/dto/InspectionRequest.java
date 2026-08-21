package jp.co.seizo.mes.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 検査登録リクエスト。測定値・規格値は現行画面 (テキスト入力) と同じく文字列で受け取り、
 * 数値以外はバリデーションエラーとして扱う。
 */
public class InspectionRequest {

	@JsonProperty("shiji_no")
	private String shijiNo;

	@JsonProperty("lot_no")
	private String lotNo;

	@JsonProperty("kensa_sha")
	private String kensaSha;

	private String sunpou;

	@JsonProperty("kijun_min")
	private String kijunMin;

	@JsonProperty("kijun_max")
	private String kijunMax;

	@JsonProperty("furyo_naiyo")
	private String furyoNaiyo;

	public String getShijiNo() {
		return shijiNo;
	}

	public void setShijiNo(String shijiNo) {
		this.shijiNo = shijiNo;
	}

	public String getLotNo() {
		return lotNo;
	}

	public void setLotNo(String lotNo) {
		this.lotNo = lotNo;
	}

	public String getKensaSha() {
		return kensaSha;
	}

	public void setKensaSha(String kensaSha) {
		this.kensaSha = kensaSha;
	}

	public String getSunpou() {
		return sunpou;
	}

	public void setSunpou(String sunpou) {
		this.sunpou = sunpou;
	}

	public String getKijunMin() {
		return kijunMin;
	}

	public void setKijunMin(String kijunMin) {
		this.kijunMin = kijunMin;
	}

	public String getKijunMax() {
		return kijunMax;
	}

	public void setKijunMax(String kijunMax) {
		this.kijunMax = kijunMax;
	}

	public String getFuryoNaiyo() {
		return furyoNaiyo;
	}

	public void setFuryoNaiyo(String furyoNaiyo) {
		this.furyoNaiyo = furyoNaiyo;
	}
}
