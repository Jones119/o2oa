package com.x.base.core.project.http;

import com.x.base.core.project.gson.GsonRecord;

public record WrapOutString(String value) implements GsonRecord {

    public WrapOutString {
    }

    public WrapOutString() {
        this(null);
    }
}
