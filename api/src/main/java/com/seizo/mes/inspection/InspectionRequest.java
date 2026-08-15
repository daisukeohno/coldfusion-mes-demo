package com.seizo.mes.inspection;

/**
 * 検査結果の登録リクエスト。
 *
 * <p>数値項目は現行画面 (テキスト入力 + {@code isNumeric} チェック) と同じ検証を行うため、
 * 文字列で受け取りサービス層でパースする。
 */
public class InspectionRequest {

    private String shijiNo;
    private String lotNo;
    private String kensaSha;
    private String sunpou;
    private String kijunMin;
    private String kijunMax;
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
