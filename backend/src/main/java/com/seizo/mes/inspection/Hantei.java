package com.seizo.mes.inspection;

import com.fasterxml.jackson.annotation.JsonValue;

/** 検査判定。t_kensa.hantei に保存される文字列と1対1で対応する。 */
public enum Hantei {
    OK("OK"),
    NG("NG"),
    SAIKENSA("再検査");

    private final String label;

    Hantei(String label) {
        this.label = label;
    }

    @JsonValue
    public String label() {
        return label;
    }

    public static Hantei fromLabel(String label) {
        for (Hantei h : values()) {
            if (h.label.equals(label)) {
                return h;
            }
        }
        throw new IllegalArgumentException("unknown hantei: " + label);
    }
}
