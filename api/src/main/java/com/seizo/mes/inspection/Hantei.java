package com.seizo.mes.inspection;

import com.fasterxml.jackson.annotation.JsonValue;

/** 検査判定。DB (t_kensa.hantei) に格納される文字列と 1:1 で対応する。 */
public enum Hantei {
    OK("OK"),
    NG("NG"),
    SAIKENSA("\u518d\u691c\u67fb");

    private final String value;

    Hantei(String value) {
        this.value = value;
    }

    /** DB / API で使う表示値。 */
    @JsonValue
    public String value() {
        return value;
    }

    public static Hantei of(String value) {
        for (Hantei h : values()) {
            if (h.value.equals(value)) {
                return h;
            }
        }
        throw new IllegalArgumentException("\u4e0d\u6b63\u306a\u5224\u5b9a\u5024: " + value);
    }
}
