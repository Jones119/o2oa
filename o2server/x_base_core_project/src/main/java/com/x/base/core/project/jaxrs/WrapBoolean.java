package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

import io.swagger.v3.oas.annotations.media.Schema;

public record WrapBoolean(@Schema(description = "布尔值.") Boolean value) implements GsonRecord {

    public WrapBoolean {
    }

    public WrapBoolean() {
        this(null);
    }
}
