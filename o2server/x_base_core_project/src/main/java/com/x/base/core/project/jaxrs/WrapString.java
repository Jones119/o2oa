package com.x.base.core.project.jaxrs;

import java.util.Objects;

import com.x.base.core.project.gson.GsonRecord;

import io.swagger.v3.oas.annotations.media.Schema;

public record WrapString(@Schema(description = "字符串值.") String value) implements GsonRecord {

    public WrapString {
    }

    public WrapString() {
        this(null);
    }

    public WrapString(Object o) {
        this(Objects.toString(o, ""));
    }
}
