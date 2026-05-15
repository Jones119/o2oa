package com.x.base.core.project.http;

import com.x.base.core.project.gson.GsonRecord;

public record WrapInString(String value) implements GsonRecord {

    public WrapInString {
    }

    public WrapInString() {
        this(null);
    }
}
