package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public record WrapInteger(Integer value) implements GsonRecord {

    public WrapInteger {
    }

    public WrapInteger() {
        this(null);
    }
}
