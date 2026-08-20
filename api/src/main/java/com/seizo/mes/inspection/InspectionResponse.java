package com.seizo.mes.inspection;

/** 検査登録レスポンス。判定と現行画面と同じメッセージ、登録された行を返す。 */
public record InspectionResponse(Hantei hantei, String message, KensaResult kensa) {}
