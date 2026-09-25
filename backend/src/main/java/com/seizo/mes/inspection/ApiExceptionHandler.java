package com.seizo.mes.inspection;

import com.fasterxml.jackson.databind.JsonMappingException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** バリデーション失敗を 400 + {errors: {field: message}} で返す。 */
@RestControllerAdvice
public class ApiExceptionHandler {

    public record ErrorResponse(String message, Map<String, String> errors) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleInvalid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.put(toSnake(fe.getField()), messageFor(fe.getField(), fe.getDefaultMessage())));
        return badRequest("入力内容に誤りがあります。", errors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (ex.getCause() instanceof JsonMappingException jme && !jme.getPath().isEmpty()) {
            String field = jme.getPath().get(jme.getPath().size() - 1).getFieldName();
            if (field != null) {
                errors.put(field, messageFor(field, "数値で入力してください。"));
            }
        }
        return badRequest("入力内容に誤りがあります。", errors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return badRequest("入力内容に誤りがあります。", Map.of(ex.getName(), "値が不正です。"));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        return badRequest(ex.getMessage(), Map.of(ex.field(), ex.getMessage()));
    }

    private static ResponseEntity<ErrorResponse> badRequest(String message, Map<String, String> errors) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(message, errors));
    }

    /** 旧画面のメッセージ "測定値は数値で入力してください。" を sunpou について踏襲する。 */
    private static String messageFor(String field, String fallback) {
        if ("sunpou".equals(field)) {
            return "測定値は数値で入力してください。";
        }
        return fallback;
    }

    private static String toSnake(String camel) {
        return camel.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }
}
