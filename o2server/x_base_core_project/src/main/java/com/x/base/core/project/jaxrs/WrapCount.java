package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public record WrapCount(Long count) implements GsonRecord {

    public WrapCount {
    }

    public WrapCount() {
        this(null);
    }

    public WrapCount(Integer o) {
        this(o != null ? o.longValue() : null);
    }
}
