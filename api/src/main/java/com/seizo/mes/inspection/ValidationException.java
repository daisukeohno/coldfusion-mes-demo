package com.seizo.mes.inspection;

/** 入力検証エラー。HTTP 400 に変換される。 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
