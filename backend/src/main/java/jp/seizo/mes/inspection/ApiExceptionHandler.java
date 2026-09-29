package jp.seizo.mes.inspection;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(InvalidMeasurementException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleInvalidMeasurement(InvalidMeasurementException ex) {
		return new ApiError(ex.getField(), ex.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleValidation(MethodArgumentNotValidException ex) {
		FieldError fieldError = ex.getBindingResult().getFieldError();
		if (fieldError == null) {
			return new ApiError(null, "入力内容に誤りがあります。");
		}
		return new ApiError(toSnakeCase(fieldError.getField()), fieldError.getDefaultMessage());
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleUnreadable(HttpMessageNotReadableException ex) {
		return new ApiError(null, "リクエストの形式が正しくありません。");
	}

	private static String toSnakeCase(String camelCase) {
		return camelCase.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase(Locale.ROOT);
	}

}
