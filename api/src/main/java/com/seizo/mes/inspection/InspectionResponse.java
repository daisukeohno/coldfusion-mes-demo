package com.seizo.mes.inspection;

/** 登録結果のレスポンス。現行画面のメッセージ文言を踏襲する。 */
public record InspectionResponse(String hantei, String message, KensaResult kensa) {
}
