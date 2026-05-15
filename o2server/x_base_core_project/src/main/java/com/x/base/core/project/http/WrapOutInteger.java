package com.x.base.core.project.http;

import com.x.base.core.project.gson.GsonRecord;

public record WrapOutInteger(Integer value) implements GsonRecord {

    public WrapOutInteger {
    }

    public WrapOutInteger() {
        this(null);
    }
}
