package com.x.base.core.project.http;

import com.x.base.core.project.gson.GsonRecord;

public record WrapOutCount(Long count) implements GsonRecord {

    public WrapOutCount {
    }

    public WrapOutCount() {
        this(null);
    }

    public WrapOutCount(Integer count) {
        this(count != null ? count.longValue() : null);
    }
}
