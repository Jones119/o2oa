package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public record WrapLong(Long value) implements GsonRecord {

    public WrapLong {
    }

    public WrapLong() {
        this(null);
    }
}
