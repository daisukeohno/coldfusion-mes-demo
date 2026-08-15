package com.seizo.mes.inspection;

/** 入力検証エラー。現行画面の "NG:" メッセージ相当を 400 で返すために使う。 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
