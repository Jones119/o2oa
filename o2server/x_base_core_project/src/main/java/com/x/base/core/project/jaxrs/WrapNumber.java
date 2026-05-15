package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public record WrapNumber(Number value) implements GsonRecord {

    public WrapNumber {
    }

    public WrapNumber() {
        this(null);
    }
}
